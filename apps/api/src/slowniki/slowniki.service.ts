import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlownikiService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatusyWydarzenia(id_organizacji: string) {
    return this.prisma.extendedClient.status_wydarzenia.findMany({
      where: { id_organizacji },
      select: {
        id: true,
        nazwa: true,
      },
      orderBy: { nazwa: 'asc' },
    });
  }

  async getKontrahenci(id_organizacji: string) {
    return this.prisma.extendedClient.kontrahent.findMany({
      where: { id_organizacji },
      select: {
        id: true,
        nazwa: true,
      },
      orderBy: { nazwa: 'asc' },
    });
  }

  async getMiejsca(id_organizacji: string) {
    return this.prisma.extendedClient.miejsce.findMany({
      where: { id_organizacji },
      select: {
        id: true,
        nazwa: true,
      },
      orderBy: { nazwa: 'asc' },
    });
  }
}