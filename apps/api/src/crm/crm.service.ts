import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(id_organizacji: number, search?: string) {
    const where: any = { id_organizacji, aktywny: true };
    if (search) {
      where.OR = [
        { nazwa: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.extendedClient.kontrahent.findMany({
      where,
      orderBy: { nazwa: 'asc' },
    });
  }

  async findOne(id: number, id_organizacji: number) {
    const client = await this.prisma.extendedClient.kontrahent.findFirst({
      where: { id, id_organizacji, aktywny: true },
      include: {
        kontakty: {
          where: { aktywny: true },
          orderBy: { nazwisko: 'asc' }
        },
        wydarzenia: {
          where: { aktywny: true },
          orderBy: { data_start: 'desc' },
          include: { manager: true }
        }
      }
    });

    if (!client) throw new NotFoundException('Nie znaleziono kontrahenta');
    return client;
  }

  async create(dto: any, id_organizacji: number) {
    return this.prisma.extendedClient.kontrahent.create({
      data: {
        id_organizacji,
        nazwa: dto.nazwa,
        nazwa_skrocona: dto.nazwa_skrocona,
        nip: dto.nip,
        kraj: dto.kraj || 'Polska',
        miasto: dto.miasto,
        ulica: dto.ulica,
        kod_pocztowy: dto.kod_pocztowy,
        email: dto.email,
        telefon: dto.telefon,
        nr_konta: dto.nr_konta,
        czy_klient: dto.czy_klient ?? true,
        czy_dostawca: !!dto.czy_dostawca,
        uwagi: dto.uwagi
      }
    });
  }

  async update(id: number, dto: any, id_organizacji: number) {
    return this.prisma.extendedClient.kontrahent.update({
      where: { id, id_organizacji },
      data: {
        nazwa: dto.nazwa,
        nazwa_skrocona: dto.nazwa_skrocona,
        nip: dto.nip,
        kraj: dto.kraj,
        miasto: dto.miasto,
        ulica: dto.ulica,
        kod_pocztowy: dto.kod_pocztowy,
        email: dto.email,
        telefon: dto.telefon,
        nr_konta: dto.nr_konta,
        czy_klient: dto.czy_klient,
        czy_dostawca: dto.czy_dostawca,
        uwagi: dto.uwagi
      }
    });
  }

  async remove(id: number, id_organizacji: number) {
    return this.prisma.extendedClient.kontrahent.update({
      where: { id, id_organizacji },
      data: { aktywny: false }
    });
  }
}