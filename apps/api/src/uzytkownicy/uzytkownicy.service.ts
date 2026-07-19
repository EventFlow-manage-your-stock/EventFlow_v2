import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UzytkownicyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(id_organizacji: number) {
    return this.prisma.extendedClient.uzytkownik.findMany({
      where: { id_organizacji, aktywny: true },
      include: { role: { include: { rola: true } } },
      orderBy: { nazwisko: 'asc' },
    });
  }

  async findOne(id: number, id_organizacji: number) {
    const user = await this.prisma.extendedClient.uzytkownik.findFirst({
      where: { id, id_organizacji, aktywny: true },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('Użytkownik nie istnieje');
    // Bezpieczeństwo: wykluczamy hasło i tokeny z odpowiedzi API
    const { haslo, token_resetu_hasla, data_waznosci_tokenu, ...safeUser } = user;
    return safeUser;
  }

  async create(dto: any, id_organizacji: number) {
    const existing = await this.prisma.extendedClient.uzytkownik.findFirst({ where: { email: dto.email, id_organizacji } });
    if (existing) throw new BadRequestException('Konto z tym e-mailem już istnieje w organizacji.');

    // Bezpieczne, domyślne hasło tymczasowe, jeśli nie podano
    const hashedPassword = await bcrypt.hash(dto.haslo || 'EventFlow123!', 10);

    return this.prisma.extendedClient.$transaction(async (tx) => {
      const user = await tx.uzytkownik.create({
        data: {
          id_organizacji,
          imie: dto.imie,
          nazwisko: dto.nazwisko,
          email: dto.email,
          telefon: dto.telefon || null,
          haslo: hashedPassword,
          stanowisko: dto.stanowisko || null,
          umiejetnosci: dto.umiejetnosci || null,
        }
      });

      if (dto.roleIds && Array.isArray(dto.roleIds)) {
        await tx.uzytkownikRola.createMany({
          data: dto.roleIds.map((id_roli: number | string) => ({
            id_organizacji,
            id_uzytkownika: user.id,
            id_roli: Number(id_roli)
          }))
        });
      }
      return user;
    });
  }

  async update(id: number, dto: any, id_organizacji: number) {
    await this.findOne(id, id_organizacji);

    return this.prisma.extendedClient.$transaction(async (tx) => {
      const dataToUpdate: any = {
        imie: dto.imie,
        nazwisko: dto.nazwisko,
        email: dto.email,
        telefon: dto.telefon || null,
        stanowisko: dto.stanowisko || null,
        umiejetnosci: dto.umiejetnosci || null,
      };

      if (dto.haslo) {
        dataToUpdate.haslo = await bcrypt.hash(dto.haslo, 10);
      }

      const user = await tx.uzytkownik.update({
        where: { id },
        data: dataToUpdate
      });

      if (dto.roleIds && Array.isArray(dto.roleIds)) {
        await tx.uzytkownikRola.deleteMany({ where: { id_uzytkownika: id } });
        if (dto.roleIds.length > 0) {
          await tx.uzytkownikRola.createMany({
            data: dto.roleIds.map((id_roli: number | string) => ({
              id_organizacji,
              id_uzytkownika: id,
              id_roli: Number(id_roli)
            }))
          });
        }
      }
      return user;
    });
  }

  async remove(id: number, id_organizacji: number) {
    return this.prisma.extendedClient.uzytkownik.update({
      where: { id },
      data: { aktywny: false, data_usuniecia: new Date() }
    });
  }
}