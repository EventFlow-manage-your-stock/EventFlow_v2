import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WynajmyService {
  constructor(private readonly prisma: PrismaService) {}
  private n(v: any) { return v === '' || v == null ? null : Number(v); }
  private d(v: any) { return v ? new Date(v) : null; }

  async findAll(id_organizacji: number) {
    return this.prisma.extendedClient.wynajem.findMany({
      where: { id_organizacji, aktywny: true },
      include: {
        kontrahent: true,
        status: true,
        oferta: true,
        // EVENTFLOW_PRODUCT_POLISH_V8: wiele ofert bezpośrednio przypisanych do jednego wynajmu.
        oferty: { where: { aktywny: true }, include: { status: true, wersje: { take: 1, orderBy: { numer_wersji: 'desc' } } }, orderBy: { data_utworzenia: 'desc' } },
        pozycje: { include: { model: true, egzemplarz: true } },
      },
      orderBy: { data_wydania: 'desc' },
    });
  }

  async findOne(id: number, id_organizacji: number) {
    const item = await this.prisma.extendedClient.wynajem.findFirst({
      where: { id, id_organizacji, aktywny: true },
      include: {
        kontrahent: true,
        status: true,
        oferta: true,
        oferty: { where: { aktywny: true }, include: { status: true, wersje: { take: 1, orderBy: { numer_wersji: 'desc' } } }, orderBy: { data_utworzenia: 'desc' } },
        pozycje: { include: { model: true, egzemplarz: true } },
      },
    });
    if (!item) throw new NotFoundException('Nie znaleziono wynajmu');
    return item;
  }

  async create(dto: any, id_organizacji: number) {
    return this.prisma.extendedClient.wynajem.create({
      data: {
        id_organizacji,
        numer: dto.numer || `W/${new Date().getFullYear()}/${Date.now().toString().slice(-5)}`,
        // EVENTFLOW_PRODUCT_POLISH_V28: wynajem nie jest już przypinany do wydarzenia; to osobny byt.
        id_oferty: this.n(dto.id_oferty),
        id_kontrahenta: this.n(dto.id_kontrahenta),
        id_statusu_wynajmu: this.n(dto.id_statusu_wynajmu),
        data_wydania: this.d(dto.data_wydania),
        data_zwrotu_planowana: this.d(dto.data_zwrotu_planowana),
        data_zwrotu_rzeczywista: this.d(dto.data_zwrotu_rzeczywista),
        notatki_wewnetrzne: dto.notatki_wewnetrzne || null,
      },
    });
  }

  async update(id: number, dto: any, id_organizacji: number) {
    await this.findOne(id, id_organizacji);
    return this.prisma.extendedClient.wynajem.update({
      where: { id },
      data: {
        numer: dto.numer || undefined,
        // EVENTFLOW_PRODUCT_POLISH_V28: wynajem nie jest już przypinany do wydarzenia; to osobny byt.
        id_oferty: this.n(dto.id_oferty),
        id_kontrahenta: this.n(dto.id_kontrahenta),
        id_statusu_wynajmu: this.n(dto.id_statusu_wynajmu),
        data_wydania: this.d(dto.data_wydania),
        data_zwrotu_planowana: this.d(dto.data_zwrotu_planowana),
        data_zwrotu_rzeczywista: this.d(dto.data_zwrotu_rzeczywista),
        notatki_wewnetrzne: dto.notatki_wewnetrzne || null,
      },
    });
  }

  async remove(id: number, id_organizacji: number) {
    await this.findOne(id, id_organizacji);
    return this.prisma.extendedClient.wynajem.update({ where: { id }, data: { aktywny: false, data_usuniecia: new Date() } });
  }

  async addPozycja(id_wynajmu: number, dto: any, id_organizacji: number) {
    await this.findOne(id_wynajmu, id_organizacji);
    return this.prisma.extendedClient.pozycjaWynajmu.create({
      data: {
        id_organizacji,
        id_wynajmu,
        id_modelu: Number(dto.id_modelu),
        id_egzemplarza: this.n(dto.id_egzemplarza),
        ilosc: Number(dto.ilosc || 1),
        notatki_wewnetrzne: dto.notatki_wewnetrzne || null,
      },
    });
  }
}
