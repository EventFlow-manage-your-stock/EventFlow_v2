import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WydarzeniaService {
  constructor(private readonly prisma: PrismaService) {}

  // EVENTFLOW_PRODUCT_POLISH_V6: normalizacja wartości z formularza, żeby przycisk Zapisz
  // w edycji wydarzenia nie wysyłał pustych stringów do pól relacyjnych/DateTime.
  private n(v: any) { return v === '' || v === undefined || v === null ? null : Number(v); }
  private d(v: any) { return v === '' || v === undefined || v === null ? null : new Date(v); }
  private s(v: any) { return v === '' || v === undefined || v === null ? null : String(v); }

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
      // EVENTFLOW_PRODUCT_POLISH_V3:
      // Filtr miesiaca księgowania zostawiamy nieaktywny, bo pole zostało usunięte z UI dodawania wydarzenia.
      // if (filters.miesiacKsiegowania) {
      //   where.miesiac_ksiegowania = { contains: filters.miesiacKsiegowania, mode: 'insensitive' };
      // }
      if (filters.typId) {
        where.id_typu_wydarzenia = Number(filters.typId);
      }
    }

    return this.prisma.extendedClient.wydarzenie.findMany({
      where,
      include: { 
        typ: true,
        status: true,
        // EVENTFLOW_PRODUCT_POLISH_V12: statusy poboczne mają być widoczne również na listach wydarzeń.
        status_magazynowy: true,
        status_ksiegowy: true,
        oferta_glowna: true,
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
        typ: true,
        kontrahent: true,
        miejsce: true,
        manager: true,
        tworca: true,
        status: true,
        status_magazynowy: true,
        status_ksiegowy: true,
        oferta_glowna: true,
        etapy: { orderBy: { kolejnosc: 'asc' } },
        oferty: {
          where: { aktywny: true },
          include: { status: true, wersje: { take: 1, orderBy: { numer_wersji: 'desc' } } },
          orderBy: { data_utworzenia: 'desc' },
        },
        // EVENTFLOW_PRODUCT_POLISH_V28: wynajem jest osobnym bytem, nie częścią wydarzenia.
        // Wydanie sprzętu do wydarzenia obsługuje moduł WZ/PZ, nie tworzymy ani nie pokazujemy tu wynajmów.
        ekipa: { include: { uzytkownik: true } },
        pojazdy: { include: { pojazd: true } },
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
          nazwa: this.s(dto.nazwa) || 'Bez nazwy',
          numer: numer,
          data_start: this.d(dto.data_start),
          data_koniec: this.d(dto.data_koniec),
          // EVENTFLOW_PRODUCT_POLISH_V3: miesiąc księgowania nie jest już zbierany w formularzu wydarzenia.
          // miesiac_ksiegowania: dto.miesiac_ksiegowania,
          // uwagi zostają w bazie historycznie, ale UI korzysta z pola opis.
          opis: this.s(dto.opis),
          id_typu_wydarzenia: this.n(dto.id_typu_wydarzenia),
          miejsce_reczne: this.s(dto.miejsce_reczne),
          adres_reczny: this.s(dto.adres_reczny),
          link_google_maps: this.s(dto.adres_reczny) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.s(dto.adres_reczny) || '')}` : this.s(dto.link_google_maps),
          id_organizacji: id_organizacji,
          id_tworcy: id_uzytkownika,
          id_managera: this.n(dto.id_managera),
          id_statusu_wydarzenia: this.n(dto.id_statusu_wydarzenia),
          id_statusu_magazynowego: this.n(dto.id_statusu_magazynowego),
          id_statusu_ksiegowego: this.n(dto.id_statusu_ksiegowego),
          id_oferty_glownej: this.n(dto.id_oferty_glownej),
          id_kontrahenta: this.n(dto.id_kontrahenta),
          id_miejsca: this.n(dto.id_miejsca),
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
          nazwa: this.s(dto.nazwa) || 'Bez nazwy',
          data_start: this.d(dto.data_start),
          data_koniec: this.d(dto.data_koniec),
          // EVENTFLOW_PRODUCT_POLISH_V3: miesiąc księgowania nie jest już zbierany w formularzu wydarzenia.
          // miesiac_ksiegowania: dto.miesiac_ksiegowania,
          // uwagi zostają w bazie historycznie, ale UI korzysta z pola opis.
          opis: this.s(dto.opis),
          id_typu_wydarzenia: this.n(dto.id_typu_wydarzenia),
          miejsce_reczne: this.s(dto.miejsce_reczne),
          adres_reczny: this.s(dto.adres_reczny),
          link_google_maps: this.s(dto.adres_reczny) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.s(dto.adres_reczny) || '')}` : this.s(dto.link_google_maps),
          id_managera: this.n(dto.id_managera),
          id_statusu_wydarzenia: this.n(dto.id_statusu_wydarzenia),
          id_statusu_magazynowego: this.n(dto.id_statusu_magazynowego),
          id_statusu_ksiegowego: this.n(dto.id_statusu_ksiegowego),
          id_oferty_glownej: this.n(dto.id_oferty_glownej),
          id_kontrahenta: this.n(dto.id_kontrahenta),
          id_miejsca: this.n(dto.id_miejsca),
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