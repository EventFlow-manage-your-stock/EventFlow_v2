import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlownikiService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatusyWydarzenia(id_organizacji: number) {
    return this.prisma.extendedClient.statusWydarzenia.findMany({
      where: { id_organizacji, aktywny: true },
      select: { id: true, nazwa: true, kolor: true },
      orderBy: { kolejnosc: 'asc' },
    });
  }

  async getStatusyMagazynowe(id_organizacji: number) {
    return this.prisma.extendedClient.statusMagazynowy.findMany({
      where: { id_organizacji, aktywny: true },
      select: { id: true, nazwa: true, kolor: true },
      orderBy: { kolejnosc: 'asc' },
    });
  }

  async getStatusyKsiegowe(id_organizacji: number) {
    return this.prisma.extendedClient.statusKsiegowy.findMany({
      where: { id_organizacji, aktywny: true },
      select: { id: true, nazwa: true, kolor: true },
      orderBy: { kolejnosc: 'asc' },
    });
  }

  async getKontrahenci(id_organizacji: number) {
    return this.prisma.extendedClient.kontrahent.findMany({
      where: { id_organizacji, aktywny: true },
      select: { id: true, nazwa: true },
      orderBy: { nazwa: 'asc' },
    });
  }

  async getMiejsca(id_organizacji: number) {
    return this.prisma.extendedClient.miejsce.findMany({
      where: { id_organizacji, aktywny: true },
      select: { id: true, nazwa: true },
      orderBy: { nazwa: 'asc' },
    });
  }

  async getUzytkownicy(id_organizacji: number) {
    return this.prisma.extendedClient.uzytkownik.findMany({
      where: { id_organizacji, aktywny: true },
      select: { id: true, imie: true, nazwisko: true, email: true },
      orderBy: { nazwisko: 'asc' },
    });
  }
}