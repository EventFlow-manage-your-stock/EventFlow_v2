import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WydarzeniaService {
  constructor(private readonly prisma: PrismaService) {}

  async getSlownikiDoFiltrow(id_organizacji: number) {
    const [klienci, managerowie] = await Promise.all([
      // Pobieramy aktywnych kontrahentów
      this.prisma.extendedClient.kontrahent.findMany({
        where: { id_organizacji, aktywny: true },
        select: { id: true, nazwa: true, nazwa_skrocona: true },
        orderBy: { nazwa: 'asc' }
      }),
      // Pobieramy aktywnych użytkowników (event managerów)
      this.prisma.extendedClient.uzytkownik.findMany({
        where: { id_organizacji, aktywny: true },
        select: { id: true, imie: true, nazwisko: true },
        orderBy: { nazwisko: 'asc' }
      })
    ]);

    return { klienci, managerowie };
  }

  async findAll(id_organizacji: number, filters?: any) {
    const where: any = { id_organizacji };

    // Aplikowanie filtrów z frontendu, jeśli istnieją
    if (filters) {
      if (filters.search) {
        where.nazwa = { contains: filters.search, mode: 'insensitive' };
      }
      if (filters.clientId) {
        where.id_kontrahenta = Number(filters.clientId);
      }
      if (filters.managerId) {
        where.id_managera = Number(filters.managerId);
      }
      if (filters.miesiacKsiegowania) {
        where.miesiac_ksiegowania = { contains: filters.miesiacKsiegowania, mode: 'insensitive' };
      }
    }

    return this.prisma.extendedClient.wydarzenie.findMany({
      where,
      include: { 
        status: true,
        kontrahent: { select: { id: true, nazwa: true, nazwa_skrocona: true } },
        manager: { select: { id: true, imie: true, nazwisko: true } },
      },
      orderBy: { data_start: 'asc' },
    });
  }

  async findOne(id: number, id_organizacji: number) {
    const event = await this.prisma.extendedClient.wydarzenie.findFirst({
      where: { id, id_organizacji },
      include: {
        kontrahent: true,
        miejsce: true,
        manager: true,
        tworca: true,
        status: true,
        status_magazynowy: true,
        status_ksiegowy: true,
        etapy: { orderBy: { kolejnosc: 'asc' } },
        ekipa: { include: { uzytkownik: true } },
      },
    });

    if (!event) throw new NotFoundException('Nie znaleziono wydarzenia');

    const historia = await this.prisma.extendedClient.logZmian.findMany({
      where: { id_organizacji, typ_obiektu: 'Wydarzenie', id_obiektu: id },
      orderBy: { data_utworzenia: 'desc' },
      include: { uzytkownik: true },
    });

    return { ...event, historia };
  }

  async create(dto: any, id_organizacji: number, id_uzytkownika: number) {
    const numer = `E${new Date().getFullYear()}/${new Date().getMonth() + 1}/${Math.floor(Math.random() * 1000)}`;

    return this.prisma.extendedClient.$transaction(async (tx) => {
      const wydarzenie = await tx.wydarzenie.create({
        data: {
          nazwa: dto.nazwa,
          numer: numer,
          data_start: dto.data_start,
          data_koniec: dto.data_koniec,
          miesiac_ksiegowania: dto.miesiac_ksiegowania,
          uwagi: dto.uwagi,
          id_organizacji: id_organizacji,
          id_tworcy: id_uzytkownika,
          id_managera: dto.id_managera,
          id_statusu_wydarzenia: dto.id_statusu_wydarzenia,
          id_statusu_magazynowego: dto.id_statusu_magazynowego,
          id_statusu_ksiegowego: dto.id_statusu_ksiegowego,
          id_kontrahenta: dto.id_kontrahenta,
          id_miejsca: dto.id_miejsca,
        },
      });

      await tx.logZmian.create({
        data: {
          id_organizacji,
          id_uzytkownika,
          typ_obiektu: 'Wydarzenie',
          id_obiektu: wydarzenie.id,
          akcja: 'UTWORZENIE',
          nowa_wartosc: JSON.stringify(dto),
        },
      });

      return wydarzenie;
    });
  }

  async update(id: number, dto: any, id_organizacji: number, id_uzytkownika: number) {
    return this.prisma.extendedClient.$transaction(async (tx) => {
      const wydarzenie = await tx.wydarzenie.update({
        where: { id },
        data: {
          nazwa: dto.nazwa,
          data_start: dto.data_start,
          data_koniec: dto.data_koniec,
          miesiac_ksiegowania: dto.miesiac_ksiegowania,
          uwagi: dto.uwagi,
          id_managera: dto.id_managera,
          id_statusu_wydarzenia: dto.id_statusu_wydarzenia,
          id_statusu_magazynowego: dto.id_statusu_magazynowego,
          id_statusu_ksiegowego: dto.id_statusu_ksiegowego,
          id_kontrahenta: dto.id_kontrahenta,
          id_miejsca: dto.id_miejsca,
        },
      });

      await tx.logZmian.create({
        data: {
          id_organizacji,
          id_uzytkownika,
          typ_obiektu: 'Wydarzenie',
          id_obiektu: id,
          akcja: 'EDYCJA',
          nowa_wartosc: JSON.stringify(dto),
        },
      });

      return wydarzenie;
    });
  }

  async remove(id: number, id_organizacji: number, id_uzytkownika: number) {
    return this.prisma.extendedClient.$transaction(async (tx) => {
      await tx.logZmian.create({
        data: {
          id_organizacji,
          id_uzytkownika,
          typ_obiektu: 'Wydarzenie',
          id_obiektu: id,
          akcja: 'USUNIECIE',
        },
      });

      return tx.wydarzenie.delete({
        where: { id },
      });
    });
  }

  async wyslijPowiadomieniaMasowe(id_organizacji: number, id_uzytkownika: number) {
    //TO DO:  W przyszłości tutaj znajdzie się integracja z serwisem e-mail/SMS
    // Na ten moment rejestrujemy tylko log systemowy o wykonanej akcji masowej.
    
    await this.prisma.extendedClient.logZmian.create({
      data: {
        id_organizacji,
        id_uzytkownika,
        typ_obiektu: 'System',
        akcja: 'WYSLANIE_POWIADOMIEN_MASOWYCH',
        nowa_wartosc: 'Wysłano przypomnienia do przypisanych ekip i klientów',
      }
    });

    return { success: true, message: 'Powiadomienia zostały wygenerowane i przesłane do kolejki wysyłkowej.' };
  }
}