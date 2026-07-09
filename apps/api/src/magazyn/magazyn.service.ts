import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MagazynService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getModeleSprzetu(id_organizacji: number, filters: any = {}) {
    const page = filters.page ? parseInt(filters.page) : 1;
    const limit = filters.limit ? parseInt(filters.limit) : 1000;
    const skip = (page - 1) * limit;

    const where: any = { id_organizacji, aktywny: true };
    if (filters.kategoriaId) where.id_kategorii = Number(filters.kategoriaId);
    if (filters.search) {
      where.OR = [
        { nazwa: { contains: filters.search, mode: 'insensitive' } },
        { kod_kreskowy: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.widocznyWMag) {
      where.widoczny_w_mag = filters.widocznyWMag === 'TAK';
    }
    if (filters.widocznyWOfercie) {
      where.widoczny_w_ofercie = filters.widocznyWOfercie === 'TAK';
    }

    const modele = await this.prisma.extendedClient.modelSprzetu.findMany({
      where,
      skip,
      take: limit,
      include: {
        kategoria: true,
        stawki: {
          where: { aktywny: true, nazwa_stawki: 'Podstawowa (PLN)' },
          take: 1
        },
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
        kategoria: model.kategoria,
        kod_kreskowy: model.kod_kreskowy,
        ulubiony: model.ulubiony,
        udostepniony_crn: model.udostepniony_crn,
        widoczny_w_mag: model.widoczny_w_mag,
        widoczny_w_ofercie: model.widoczny_w_ofercie,
        cena_podstawowa: model.stawki?.[0]?.cena_netto || 0,
        uwagi: model.notatki_wewnetrzne,
        zdjecie: model.zdjecie,
        _count: { egzemplarze: totalStanie },
        stan: {
          total: totalStanie,
          magazyn: wMagazynie,
          eventy: naEventach > 0 ? naEventach : 0,
          serwis: wSerwisie,
          rack: 0 
        },
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
        stawki: { where: { aktywny: true }, orderBy: { id: 'asc' } },
        egzemplarze: {
          where: { aktywny: true },
          orderBy: { id: 'asc' },
          include: { 
            magazyn: true,
            case: { select: { id: true, nazwa: true, numer_urzadzenia: true, model: { select: { nazwa: true } } } },
            _count: { select: { zawartosc_case: { where: { aktywny: true } } } }
          }
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

  async usunModelSoft(id: number, id_organizacji: number, id_uzytkownika: number | null) {
    const safeUserId = isNaN(Number(id_uzytkownika)) ? null : Number(id_uzytkownika);
    return this.prisma.extendedClient.$transaction(async (tx) => {
      const model = await tx.modelSprzetu.update({
        where: { id, id_organizacji },
        data: { aktywny: false, data_usuniecia: new Date() }
      });

      await tx.logZmian.create({
        data: {
          id_organizacji,
          id_uzytkownika: safeUserId,
          typ_obiektu: 'ModelSprzetu',
          id_obiektu: id,
          akcja: 'USUNIECIE',
        },
      });

      return model;
    });
  }

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
          kod_kreskowy: this.cleanString(dto.kod_kreskowy) || `SN-${Date.now()}`,
          
          szerokosc: this.cleanNumber(dto.szerokosc),
          wysokosc: this.cleanNumber(dto.wysokosc),
          glebokosc: this.cleanNumber(dto.glebokosc),
          waga: this.cleanNumber(dto.waga),
          objetosc: this.cleanNumber(dto.objetosc),
          wartosc: this.cleanNumber(dto.wartosc),
          qr_kod: this.cleanString(dto.qr_kod),
          notatki_wewnetrzne: this.cleanString(dto.notatki_wewnetrzne)
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

      if (dto.tworz_zgloszenie && dto.tytul_usterki && dto.id_statusu_serwisu && safeUserId) {
        await tx.serwisSprzetu.create({
          data: {
            id_organizacji,
            id_egzemplarza: egzemplarz.id,
            id_statusu_serwisu: this.cleanNumber(dto.id_statusu_serwisu)!,
            id_uzytkownika_zglosil: safeUserId,
            tytul: this.cleanString(dto.tytul_usterki)!,
            opis: this.cleanString(dto.opis_usterki)
          }
        });
      }

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

          szerokosc: this.cleanNumber(dto.szerokosc),
          wysokosc: this.cleanNumber(dto.wysokosc),
          glebokosc: this.cleanNumber(dto.glebokosc),
          waga: this.cleanNumber(dto.waga),
          objetosc: this.cleanNumber(dto.objetosc),
          wartosc: this.cleanNumber(dto.wartosc),
          qr_kod: this.cleanString(dto.qr_kod),
          notatki_wewnetrzne: this.cleanString(dto.notatki_wewnetrzne)
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

      if (dto.tworz_zgloszenie && dto.tytul_usterki && dto.id_statusu_serwisu && safeUserId) {
        await tx.serwisSprzetu.create({
          data: {
            id_organizacji,
            id_egzemplarza: egzemplarz.id,
            id_statusu_serwisu: this.cleanNumber(dto.id_statusu_serwisu)!,
            id_uzytkownika_zglosil: safeUserId,
            tytul: this.cleanString(dto.tytul_usterki)!,
            opis: this.cleanString(dto.opis_usterki)
          }
        });
      }

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

  async getFizyczneCase(id_organizacji: number) {
    return this.prisma.extendedClient.egzemplarz.findMany({
      where: { 
        id_organizacji, 
        aktywny: true,
        model: { typ_sprzetu: 'opakowanie' } 
      },
      include: {
        model: { select: { nazwa: true } },
        _count: { select: { zawartosc_case: { where: { aktywny: true } } } }
      },
      orderBy: { nazwa: 'asc' }
    });
  }

  async getEgzemplarzById(id: number, id_organizacji: number) {
    return this.prisma.extendedClient.egzemplarz.findFirst({
      where: { id, id_organizacji, aktywny: true },
      include: {
        model: true,
        magazyn: true,
        case: { select: { id: true, nazwa: true, numer_urzadzenia: true } },
        zawartosc_case: {
          where: { aktywny: true },
          include: { model: true, magazyn: true },
          orderBy: { nazwa: 'asc' }
        }
      }
    });
  }

  async getDostepneDoCase(id_organizacji: number, id_case: number) {
    return this.prisma.extendedClient.egzemplarz.findMany({
      where: {
        id_organizacji,
        aktywny: true,
        id_case: null,
        id: { not: id_case },
        model: { typ_sprzetu: 'sprzet' } 
      },
      include: { model: true },
      orderBy: { nazwa: 'asc' }
    });
  }

  async modyfikujZawartoscCase(id_case: number, itemIds: number[], akcja: 'add' | 'remove', id_organizacji: number, id_uzytkownika: number | null) {
    const safeUserId = isNaN(Number(id_uzytkownika)) ? null : Number(id_uzytkownika);

    return this.prisma.extendedClient.$transaction(async (tx) => {
      const skrzynia = await tx.egzemplarz.findFirst({
        where: { id: id_case, id_organizacji, aktywny: true }
      });

      if (!skrzynia) throw new NotFoundException('Nie znaleziono skrzyni');

      await tx.egzemplarz.updateMany({
        where: { id: { in: itemIds }, id_organizacji },
        data: { id_case: akcja === 'add' ? id_case : null }
      });

      for (const itemId of itemIds) {
        await tx.logZmian.create({
          data: {
            id_organizacji,
            id_uzytkownika: safeUserId,
            typ_obiektu: 'Egzemplarz',
            id_obiektu: itemId,
            akcja: akcja === 'add' ? 'ZAPAKOWANIE_DO_CASE' : 'WYJECIE_Z_CASE',
            nowa_wartosc: JSON.stringify({ id_case: akcja === 'add' ? id_case : null }),
          },
        });
      }

      return { success: true, updatedCount: itemIds.length };
    });
  }

  async getListaOpakowan(id_organizacji: number) {
    return this.prisma.extendedClient.egzemplarz.findMany({
      where: {
        id_organizacji,
        aktywny: true,
        model: { typ_sprzetu: 'opakowanie' }
      },
      include: {
        model: {
          include: { kategoria: true }
        },
        magazyn: true,
        zawartosc_case: {
          where: { aktywny: true },
          include: {
            model: true,
            magazyn: true
          },
          orderBy: { nazwa: 'asc' }
        }
      },
      orderBy: { nazwa: 'asc' }
    });
  }

  async getCennikGlobalny(id_organizacji: number, kategoriaId?: number, search?: string) {
    const where: any = { id_organizacji, aktywny: true };
    if (kategoriaId) where.id_kategorii = kategoriaId;
    if (search) {
      where.OR = [
        { nazwa: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.extendedClient.modelSprzetu.findMany({
      where,
      include: {
        kategoria: true,
        stawki: {
          where: { aktywny: true, nazwa_stawki: 'Podstawowa (PLN)' },
          take: 1
        }
      },
      orderBy: { nazwa: 'asc' }
    });
  }

  async updateCenyMasowo(updates: { id_modelu: number, cena: number | null }[], id_organizacji: number) {
    return this.prisma.extendedClient.$transaction(async (tx) => {
      let zaktualizowano = 0;
      for (const update of updates) {
        const istniejaca = await tx.cenaModelu.findFirst({
          where: { id_modelu: update.id_modelu, id_organizacji, nazwa_stawki: 'Podstawowa (PLN)', aktywny: true }
        });

        if (istniejaca) {
          await tx.cenaModelu.update({
            where: { id: istniejaca.id },
            data: { cena_netto: update.cena }
          });
        } else {
          await tx.cenaModelu.create({
            data: {
              id_organizacji,
              id_modelu: update.id_modelu,
              nazwa_stawki: 'Podstawowa (PLN)',
              cena_netto: update.cena
            }
          });
        }
        zaktualizowano++;
      }
      return { success: true, count: zaktualizowano };
    });
  }

  async addStawkaToModel(id_modelu: number, dto: any, id_organizacji: number) {
    return this.prisma.extendedClient.cenaModelu.create({
      data: {
        id_organizacji,
        id_modelu,
        nazwa_stawki: this.cleanString(dto.nazwa_stawki) || 'Nowa stawka',
        cena_netto: this.cleanNumber(dto.cena_netto),
        koszt: this.cleanNumber(dto.koszt),
        nazwa_kosztu: this.cleanString(dto.nazwa_kosztu),
        mnoz_koszt: this.cleanBoolean(dto.mnoz_koszt)
      }
    });
  }

  async updateStawka(id: number, dto: any, id_organizacji: number) {
    return this.prisma.extendedClient.cenaModelu.update({
      where: { id, id_organizacji },
      data: {
        nazwa_stawki: this.cleanString(dto.nazwa_stawki),
        cena_netto: this.cleanNumber(dto.cena_netto),
        koszt: this.cleanNumber(dto.koszt),
        nazwa_kosztu: this.cleanString(dto.nazwa_kosztu),
        mnoz_koszt: this.cleanBoolean(dto.mnoz_koszt)
      }
    });
  }

  async deleteStawka(id: number, id_organizacji: number) {
    return this.prisma.extendedClient.cenaModelu.update({
      where: { id, id_organizacji },
      data: { aktywny: false }
    });
  }

  // --- ZAKŁADKA "EGZEMPLARZE" - Pełna lista wszystkich sztuk fizycznych ---
  async getWszystkieEgzemplarze(id_organizacji: number, filters: any = {}) {
    const where: any = { id_organizacji, aktywny: true };

    if (filters.searchItem) {
      where.OR = [
        { nazwa: { contains: filters.searchItem, mode: 'insensitive' } },
        { sn: { contains: filters.searchItem, mode: 'insensitive' } },
        { kod_kreskowy: { contains: filters.searchItem, mode: 'insensitive' } },
        { numer_urzadzenia: { contains: filters.searchItem, mode: 'insensitive' } },
      ];
    }
    
    if (filters.searchModel) {
      where.model = { nazwa: { contains: filters.searchModel, mode: 'insensitive' } };
    }

    if (filters.searchCategory) {
      where.model = {
        ...where.model,
        kategoria: { nazwa: { contains: filters.searchCategory, mode: 'insensitive' } }
      };
    }

    return this.prisma.extendedClient.egzemplarz.findMany({
      where,
      include: {
        model: {
          include: { kategoria: true }
        },
        magazyn: true
      },
      orderBy: { data_utworzenia: 'desc' }
    });
  }
}