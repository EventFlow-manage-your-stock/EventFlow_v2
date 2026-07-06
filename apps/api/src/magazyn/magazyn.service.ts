import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MagazynService {
  constructor(private readonly prisma: PrismaService) {}

  async getKategorie(id_organizacji: number) {
    return this.prisma.extendedClient.kategoria.findMany({
      where: { id_organizacji, id_rodzica: null, aktywny: true },
      include: {
        dzieci: {
          where: { aktywny: true },
          orderBy: { kolejnosc: 'asc' }
        }
      },
      orderBy: { kolejnosc: 'asc' },
    });
  }

  async getModeleSprzetu(
    id_organizacji: number,
    page: number = 1,
    limit: number = 20,
    kategoriaId?: number,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = { id_organizacji, aktywny: true };
    if (kategoriaId) where.id_kategorii = kategoriaId;
    if (search) {
      where.OR = [
        { nazwa: { contains: search, mode: 'insensitive' } },
        { kod_kreskowy: { contains: search, mode: 'insensitive' } },
      ];
    }

    const modele = await this.prisma.extendedClient.modelSprzetu.findMany({
      where,
      skip,
      take: limit,
      include: {
        kategoria: true,
        ceny: {
          where: { aktywny: true },
          take: 1
        },
        egzemplarze: {
          where: { aktywny: true },
          select: {
            id_statusu_egzemplarza: true
          }
        }
      },
      orderBy: { nazwa: 'asc' },
    });

    return modele.map(model => {
      const totalStanie = model.egzemplarze.length;
      const wMagazynie = Math.floor(totalStanie * 0.8);
      const naEventach = Math.floor(totalStanie * 0.1);
      const wSerwisie = totalStanie - wMagazynie - naEventach;

      return {
        id: model.id,
        nazwa: model.nazwa,
        typ_sprzetu: model.typ_sprzetu,
        kategoria_nazwa: model.kategoria?.nazwa || '-',
        kod_kreskowy: model.kod_kreskowy,
        ulubiony: model.ulubiony,
        udostepniony_crn: model.udostepniony_crn,
        cena_podstawowa: model.ceny[0]?.cena_netto || 0,
        uwagi: model.notatki_wewnetrzne,
        zdjecie: model.zdjecie,
        stan: {
          total: totalStanie,
          magazyn: wMagazynie,
          eventy: naEventach,
          serwis: wSerwisie,
          rack: 0 
        },
        dostepnych: wMagazynie
      };
    });
  }

  async createModelSprzetu(dto: any, id_organizacji: number) {
    const cleanNumber = (val: any) => (val === "" || val === undefined || val === null || isNaN(Number(val))) ? null : Number(val);

    return this.prisma.extendedClient.modelSprzetu.create({
      data: {
        id_organizacji,
        nazwa: dto.nazwa,
        typ_sprzetu: dto.typ_sprzetu || 'sprzet',
        id_kategorii: cleanNumber(dto.id_kategorii),
        kod_kreskowy: dto.kod_kreskowy || null,
        notatki_wewnetrzne: dto.notatki_wewnetrzne || null,
        szerokosc: cleanNumber(dto.szerokosc),
        wysokosc: cleanNumber(dto.wysokosc),
        glebokosc: cleanNumber(dto.glebokosc),
        waga: cleanNumber(dto.waga),
        objetosc: cleanNumber(dto.objetosc),
        pobor_pradu: cleanNumber(dto.pobor_pradu),
        miejsce_w_mag: dto.miejsce_w_mag || null,
        widoczny_w_ofercie: true,
        widoczny_w_mag: true,
      }
    });
  }

  async getModelById(id: number, id_organizacji: number) {
    return this.prisma.extendedClient.modelSprzetu.findFirst({
      where: { id, id_organizacji, aktywny: true },
      include: {
        kategoria: true,
        ceny: { where: { aktywny: true } },
        egzemplarze: {
          where: { aktywny: true },
          orderBy: { nazwa: 'asc' },
          include: { magazyn: true }
        }
      }
    });
  }

  async updateModel(id: number, dto: any, id_organizacji: number) {
    const cleanNumber = (val: any) => (val === "" || val === undefined || val === null || isNaN(Number(val))) ? null : Number(val);

    return this.prisma.extendedClient.modelSprzetu.update({
      where: { id, id_organizacji },
      data: {
        nazwa: dto.nazwa,
        typ_sprzetu: dto.typ_sprzetu,
        id_kategorii: cleanNumber(dto.id_kategorii),
        producent: dto.producent,
        szerokosc: cleanNumber(dto.szerokosc),
        wysokosc: cleanNumber(dto.wysokosc),
        glebokosc: cleanNumber(dto.glebokosc),
        waga: cleanNumber(dto.waga),
        objetosc: cleanNumber(dto.objetosc),
        pobor_pradu: cleanNumber(dto.pobor_pradu),
        miejsce_w_mag: dto.miejsce_w_mag,
        kod_kreskowy: dto.kod_kreskowy,
        notatki_wewnetrzne: dto.notatki_wewnetrzne
      }
    });
  }

  async deleteModel(id: number, id_organizacji: number) {
    return this.prisma.extendedClient.modelSprzetu.update({
      where: { id, id_organizacji },
      data: { aktywny: false }
    });
  }

  async getMagazyny(id_organizacji: number) {
    return this.prisma.extendedClient.magazyn.findMany({
      where: { id_organizacji, aktywny: true },
      orderBy: { nazwa: 'asc' },
    });
  }

  async createEgzemplarz(id_modelu: number, dto: any, id_organizacji: number, id_uzytkownika: number | null) {
    const cleanNumber = (val: any) => (val === "" || val === undefined || val === null || isNaN(Number(val))) ? null : Number(val);
    const safeUserId = (id_uzytkownika && !isNaN(id_uzytkownika)) ? id_uzytkownika : null;

    return this.prisma.extendedClient.$transaction(async (tx) => {
      const egzemplarz = await tx.egzemplarz.create({
        data: {
          id_organizacji,
          id_modelu,
          nazwa: dto.nazwa,
          numer_urzadzenia: dto.numer_urzadzenia,
          sn: dto.sn,
          data_produkcji: dto.data_produkcji ? new Date(dto.data_produkcji) : null,
          id_magazynu: cleanNumber(dto.id_magazynu),
          miejsce_w_mag: dto.miejsce_w_mag,
          opis: dto.opis,
          pakowany_pojedynczo: dto.pakowany_pojedynczo === true || String(dto.pakowany_pojedynczo) === 'true',
          cena_zakupu: cleanNumber(dto.cena_zakupu),
          id_case: cleanNumber(dto.id_case),
          status_serwisowy: dto.status_serwisowy || "Działa",
          kod_kreskowy: dto.kod_kreskowy || `SN-${Date.now()}`
        }
      });

      await tx.logZmian.create({
        data: {
          id_organizacji,
          id_uzytkownika: safeUserId, // Bezpieczne logowanie
          typ_obiektu: 'Egzemplarz',
          id_obiektu: egzemplarz.id,
          akcja: 'UTWORZENIE',
          nowa_wartosc: JSON.stringify(dto),
        },
      });

      return egzemplarz;
    });
  }

  async updateEgzemplarz(id: number, dto: any, id_organizacji: number, id_uzytkownika: number | null) {
    const cleanNumber = (val: any) => (val === "" || val === undefined || val === null || isNaN(Number(val))) ? null : Number(val);
    const safeUserId = (id_uzytkownika && !isNaN(id_uzytkownika)) ? id_uzytkownika : null;

    return this.prisma.extendedClient.$transaction(async (tx) => {
      const egzemplarz = await tx.egzemplarz.update({
        where: { id, id_organizacji },
        data: {
          nazwa: dto.nazwa,
          numer_urzadzenia: dto.numer_urzadzenia,
          sn: dto.sn,
          data_produkcji: dto.data_produkcji ? new Date(dto.data_produkcji) : null,
          id_magazynu: cleanNumber(dto.id_magazynu),
          miejsce_w_mag: dto.miejsce_w_mag,
          opis: dto.opis,
          pakowany_pojedynczo: dto.pakowany_pojedynczo === true || String(dto.pakowany_pojedynczo) === 'true',
          cena_zakupu: cleanNumber(dto.cena_zakupu),
          id_case: cleanNumber(dto.id_case),
          status_serwisowy: dto.status_serwisowy,
          kod_kreskowy: dto.kod_kreskowy,
        }
      });

      await tx.logZmian.create({
        data: {
          id_organizacji,
          id_uzytkownika: safeUserId,
          typ_obiektu: 'Egzemplarz',
          id_obiektu: id,
          akcja: 'EDYCJA',
          nowa_wartosc: JSON.stringify(dto),
        },
      });

      return egzemplarz;
    });
  }

  async deleteEgzemplarz(id: number, id_organizacji: number, id_uzytkownika: number | null) {
    const safeUserId = (id_uzytkownika && !isNaN(id_uzytkownika)) ? id_uzytkownika : null;

    return this.prisma.extendedClient.$transaction(async (tx) => {
      const egzemplarz = await tx.egzemplarz.update({
        where: { id, id_organizacji },
        data: { aktywny: false }
      });

      await tx.logZmian.create({
        data: {
          id_organizacji,
          id_uzytkownika: safeUserId,
          typ_obiektu: 'Egzemplarz',
          id_obiektu: id,
          akcja: 'USUNIECIE'
        },
      });

      return egzemplarz;
    });
  }
}