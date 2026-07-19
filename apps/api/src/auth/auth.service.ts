import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    // Inicjalizacja klienta SMTP do wysyłki maili
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async login(email: string, passwordRaw: string) {
    const uzytkownik = await this.prisma.uzytkownik.findFirst({
      where: { email },
      include: { 
        organizacja: true,
        role: { include: { rola: true } }
      },
    });

    if (!uzytkownik) {
      throw new UnauthorizedException('Nieprawidłowe dane logowania');
    }

    const isPasswordValid = await bcrypt.compare(passwordRaw, uzytkownik.haslo);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Nieprawidłowe dane logowania');
    }

    if (!uzytkownik.aktywny || !uzytkownik.organizacja.aktywny) {
      throw new UnauthorizedException('Konto lub organizacja są nieaktywne');
    }

    const payload = { 
      sub: uzytkownik.id, 
      email: uzytkownik.email,
      orgId: uzytkownik.id_organizacji,
      role: uzytkownik.role[0]?.rola.nazwa || 'Użytkownik'
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: uzytkownik.id,
        email: uzytkownik.email,
        imie: uzytkownik.imie,
        nazwisko: uzytkownik.nazwisko,
        organizacja: uzytkownik.organizacja.nazwa,
        role: payload.role
      }
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.uzytkownik.findFirst({ where: { email, aktywny: true } });
    
    // Niezależnie czy mail istnieje czy nie, odpowiadamy tak samo (zapobiega wyliczaniu kont przez hakerów)
    if (!user) {
      return { success: true, message: 'Jeśli adres e-mail istnieje w bazie, wysłano na niego link.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 3600000); // Token ważny 1 godzinę

    await this.prisma.uzytkownik.updateMany({
      where: { email },
      data: { token_resetu_hasla: resetToken, data_waznosci_tokenu: tokenExpiry }
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Właściwa wysyłka HTML na E-mail
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"EventFlow" <no-reply@eventflow.pl>',
        to: email,
        subject: 'Zresetuj swoje hasło do EventFlow',
        html: `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-bottom: 10px;">Utworzenie nowego hasła</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Witaj ${user.imie},</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Otrzymaliśmy prośbę o zresetowanie lub utworzenie nowego hasła do Twojego konta pracowniczego w systemie EventFlow WMS.</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #0891B2; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Ustaw nowe hasło
              </a>
            </div>
            
            <p style="color: #475569; font-size: 14px;">Jeśli to nie Ty prosiłeś o zmianę, zignoruj tę wiadomość. Twój link wygaśnie za 60 minut ze względów bezpieczeństwa.</p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">Wiadomość wygenerowana automatycznie. Prosimy na nią nie odpowiadać.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Błąd podczas wysyłki maila:', error);
      // Nie rzucamy wyjątku celowo, aby użytkownik nie wiedział, że wystąpił problem techniczny SMTP
    }

    return { success: true, message: 'Jeśli adres e-mail istnieje w bazie, wysłano na niego link.' };
  }

  async resetPassword(token: string, passwordRaw: string) {
    const user = await this.prisma.uzytkownik.findFirst({
      where: { 
        token_resetu_hasla: token,
        data_waznosci_tokenu: { gt: new Date() } // Weryfikacja przydatności tokenu
      }
    });

    if (!user) {
      throw new UnauthorizedException('Token bezpieczeństwa jest nieprawidłowy lub stracił ważność.');
    }

    const hashedPassword = await bcrypt.hash(passwordRaw, 10);

    // Zapisujemy hasło i od razu "spalamy" użyty token
    await this.prisma.uzytkownik.update({
      where: { id: user.id },
      data: { 
        haslo: hashedPassword, 
        token_resetu_hasla: null, 
        data_waznosci_tokenu: null 
      }
    });

    return { success: true, message: 'Twoje nowe hasło zostało pomyślnie zapisane.' };
  }
}