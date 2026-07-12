import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(id_organizacji: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // EVENTFLOW_PRODUCT_POLISH_V3:
    // Zgodnie z listą poprawek zostawiamy KPI "wydarzenia w tym tygodniu"
    // i dodajemy KPI aktywnego serwisu. Stare KPI ofert/przychodu/sprzętu
    // nie są usuwane z bazy, tylko nie są już zwracane jako główne kafelki kokpitu.
    const [wydarzeniaTygodnia, aktywneSerwisy, dzisiejszeWydarzeniaRaw, serwisy] = await Promise.all([
      this.prisma.extendedClient.wydarzenie.count({
        where: {
          id_organizacji,
          aktywny: true,
          data_start: { gte: startOfWeek, lt: endOfWeek },
        },
      }),
      this.prisma.extendedClient.serwisSprzetu.count({
        where: { id_organizacji, aktywny: true, data_rozwiazania: null },
      }),
      this.prisma.extendedClient.wydarzenie.findMany({
        where: {
          id_organizacji,
          aktywny: true,
          data_start: { lt: tomorrow },
          data_koniec: { gte: today },
        },
        include: {
          miejsce: true,
          kontrahent: true,
          status: true,
          typ: true,
          manager: true,
        },
        orderBy: { data_start: 'asc' },
      }),
      this.prisma.extendedClient.serwisSprzetu.findMany({
        where: { id_organizacji, aktywny: true, data_rozwiazania: null },
        include: { egzemplarz: { include: { model: true } }, status: true },
        take: 5,
        orderBy: { data_zgloszenia: 'desc' },
      }),
    ]);

    const todaysEvents = dzisiejszeWydarzeniaRaw.map((event) => {
      const startHour = event.data_start ? event.data_start.getHours() : 8;
      const currentHour = new Date().getHours();
      let progress = ((currentHour - startHour) / 12) * 100;
      if (progress < 0) progress = 0;
      if (progress > 100) progress = 100;

      return {
        id: event.id,
        title: event.nazwa,
        type: event.typ?.nazwa ?? 'Wydarzenie',
        typeColor: event.typ?.kolor ?? '#06B6D4',
        statusIcon: (event.status as any)?.ikona ?? '●',
        location: event.miejsce ? event.miejsce.nazwa : event.kontrahent?.nazwa || 'Lokalizacja nieznana',
        status: event.status?.nazwa || 'W trakcie',
        time: event.data_start && event.data_koniec
          ? `${event.data_start.toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'})} - ${event.data_koniec.toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'})}`
          : 'Cały dzień',
        progress,
        manager: event.manager ? `${event.manager.imie.charAt(0)}${event.manager.nazwisko.charAt(0)}` : 'SYS'
      };
    });

    const alerts: Array<{ id: string; type: string; message: string; actionText?: string }> = [];
    for (const s of serwisy) {
      alerts.push({
        id: `serwis-${s.id}`,
        type: 'warning',
        message: `${s.egzemplarz?.model?.nazwa || s.egzemplarz?.nazwa || 'Sprzęt'}: ${s.tytul} (${s.status?.nazwa || 'serwis'})`,
        actionText: 'Otwórz serwis',
      });
    }

    return {
      kpis: {
        eventsThisWeek: wydarzeniaTygodnia,
        activeService: aktywneSerwisy,
      },
      todaysEvents,
      alerts,
    };
  }
}
