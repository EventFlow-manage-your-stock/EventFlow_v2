import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MagazynService {
  constructor(private readonly prisma: PrismaService) {}

  // --- HELPERY DO BEZPIECZNEGO PARSOWANIA DANYCH ---
  private cleanNumber(val: any): number | null {
    if (val === "" || val === null || val === undefined) return null;
    const parsed = Number(val);
    return isNaN(parsed) ? null : parsed;
  }

  private cleanString(val: any): string | null {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    return str === "" ? null : str;
  }

  private cleanDate(val: any): Date | null {
    if (!val || val === "") return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  private cleanBoolean(val: any): boolean {
    return val === true || val === 'true' || val === 1 || val === '1';
  }

  // --- MODELE SPRZĘTU ---
  async getKategorie(id_organizacji: number) {
    return this.prisma.extendedClient.kategoria.findMany({
      where: { id_organizacji, id_rodzica: null, aktywny: true },
      include: { dzieci: { where: { aktywny: true }, orderBy: { kolejnosc: 'asc' } } },
      orderBy: { kolejnosc: 'asc' },
    });
  }

  async getModeleSprzetu(id_organizacji: number, page: number = 1, limit: number = 20, kategoriaId?: number, search?: string) {
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
      where, skip, take: limit,
      include: {
        kategoria: true,
        ceny: { where: { aktywny: true }, take: 1 },
        egzemplarze: {
          where: { aktywny: true },
          select: { id_statusu_egzemplarza: true, status_serwisowy: true }
        }
      },
      orderBy: { nazwa: 'asc' },
    });

    return modele.map(model => {
      const totalStanie = model.egzemplarze.length;
      const wMagazynie = model.egzemplarze.filter(e => e.status_serwisowy === 'Działa' || e.status_serwisowy === 'Naprawiony').length;
      const wSerwisie = model.egzemplarze.filter(e => e.status_serwisowy?.includes('Wymaga') || e.status_serwisowy === 'W serwisie').length;
      const naEventach = totalStanie - wMagazynie - wSerwisie;

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
        stan: { total: totalStanie, magazyn: wMagazynie, eventy: naEventach > 0 ? naEventach : 0, serwis: wSerwisie, rack: 0 },
        dostepnych: wMagazynie
      };
    });
  }

  async createModelSprzetu(dto: any, id_organizacji: number) {
    return this.prisma.extendedClient.modelSprzetu.create({
      data: {
        id_organizacji,
        nazwa: this.cleanString(dto.nazwa),
        typ_sprzetu: this.cleanString(dto.typ_sprzetu) || 'sprzet',
        id_kategorii: this.cleanNumber(dto.id_kategorii),
        kod_kreskowy: this.cleanString(dto.kod_kreskowy),
        notatki_wewnetrzne: this.cleanString(dto.notatki_wewnetrzne),
        szerokosc: this.cleanNumber(dto.szerokosc),
        wysokosc: this.cleanNumber(dto.wysokosc),
        glebokosc: this.cleanNumber(dto.glebokosc),
        waga: this.cleanNumber(dto.waga),
        objetosc: this.cleanNumber(dto.objetosc),
        pobor_pradu: this.cleanNumber(dto.pobor_pradu),
        miejsce_w_mag: this.cleanString(dto.miejsce_w_mag),
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
          orderBy: { id: 'asc' },
          include: { magazyn: true }
        }
      }
    });
  }

  async updateModel(id: number, dto: any, id_organizacji: number) {
    return this.prisma.extendedClient.modelSprzetu.update({
      where: { id, id_organizacji },
      data: {
        nazwa: this.cleanString(dto.nazwa),
        typ_sprzetu: this.cleanString(dto.typ_sprzetu),
        id_kategorii: this.cleanNumber(dto.id_kategorii),
        producent: this.cleanString(dto.producent),
        szerokosc: this.cleanNumber(dto.szerokosc),
        wysokosc: this.cleanNumber(dto.wysokosc),
        glebokosc: this.cleanNumber(dto.glebokosc),
        waga: this.cleanNumber(dto.waga),
        objetosc: this.cleanNumber(dto.objetosc),
        pobor_pradu: this.cleanNumber(dto.pobor_pradu),
        miejsce_w_mag: this.cleanString(dto.miejsce_w_mag),
        kod_kreskowy: this.cleanString(dto.kod_kreskowy),
        notatki_wewnetrzne: this.cleanString(dto.notatki_wewnetrzne)
      }
    });
  }

  async deleteModel(id: number, id_organizacji: number) {
    return this.prisma.extendedClient.modelSprzetu.update({
      where: { id, id_organizacji },
      data: { aktywny: false }
    });
  }

  // --- EGZEMPLARZE SPRZĘTU ---
  async getMagazyny(id_organizacji: number) {
    return this.prisma.extendedClient.magazyn.findMany({
      where: { id_organizacji, aktywny: true },
      orderBy: { nazwa: 'asc' },
    });
  }

  async createEgzemplarz(id_modelu: number, dto: any, id_organizacji: number, id_uzytkownika: number | null) {
    const safeUserId = isNaN(Number(id_uzytkownika)) ? null : Number(id_uzytkownika);

    return this.prisma.extendedClient.$transaction(async (tx) => {
      const egzemplarz = await tx.egzemplarz.create({
        data: {
          id_organizacji,
          id_modelu,
          nazwa: this.cleanString(dto.nazwa),
          numer_urzadzenia: this.cleanString(dto.numer_urzadzenia),
          sn: this.cleanString(dto.sn),
          data_produkcji: this.cleanDate(dto.data_produkcji),
          id_magazynu: this.cleanNumber(dto.id_magazynu),
          miejsce_w_mag: this.cleanString(dto.miejsce_w_mag),
          opis: this.cleanString(dto.opis),
          pakowany_pojedynczo: this.cleanBoolean(dto.pakowany_pojedynczo),
          cena_zakupu: this.cleanNumber(dto.cena_zakupu),
          id_case: this.cleanNumber(dto.id_case),
          status_serwisowy: this.cleanString(dto.status_serwisowy) || "Działa",
          kod_kreskowy: this.cleanString(dto.kod_kreskowy) || `SN-${Date.now()}`
        }
      });

      await tx.logZmian.create({
        data: {
          id_organizacji,
          id_uzytkownika: safeUserId,
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
    const safeUserId = isNaN(Number(id_uzytkownika)) ? null : Number(id_uzytkownika);

    return this.prisma.extendedClient.$transaction(async (tx) => {
      const egzemplarz = await tx.egzemplarz.update({
        where: { id, id_organizacji },
        data: {
          nazwa: this.cleanString(dto.nazwa),
          numer_urzadzenia: this.cleanString(dto.numer_urzadzenia),
          sn: this.cleanString(dto.sn),
          data_produkcji: this.cleanDate(dto.data_produkcji),
          id_magazynu: this.cleanNumber(dto.id_magazynu),
          miejsce_w_mag: this.cleanString(dto.miejsce_w_mag),
          opis: this.cleanString(dto.opis),
          pakowany_pojedynczo: this.cleanBoolean(dto.pakowany_pojedynczo),
          cena_zakupu: this.cleanNumber(dto.cena_zakupu),
          id_case: this.cleanNumber(dto.id_case),
          status_serwisowy: this.cleanString(dto.status_serwisowy) || "Działa",
          kod_kreskowy: this.cleanString(dto.kod_kreskowy),
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
    const safeUserId = isNaN(Number(id_uzytkownika)) ? null : Number(id_uzytkownika);

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