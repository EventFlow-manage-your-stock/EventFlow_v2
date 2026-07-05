import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { SlownikiService } from './slowniki.service';

@Controller('api/slowniki')
@UseGuards(AuthGuard('jwt'))
export class SlownikiController {
  constructor(private readonly slownikiService: SlownikiService) {}

  @Get('statusy-wydarzenia')
  async getStatusyWydarzenia(@Req() req: Request) {
    return this.slownikiService.getStatusyWydarzenia(Number((req.user as any).id_organizacji));
  }

  @Get('statusy-magazynowe')
  async getStatusyMagazynowe(@Req() req: Request) {
    return this.slownikiService.getStatusyMagazynowe(Number((req.user as any).id_organizacji));
  }

  @Get('statusy-ksiegowe')
  async getStatusyKsiegowe(@Req() req: Request) {
    return this.slownikiService.getStatusyKsiegowe(Number((req.user as any).id_organizacji));
  }

  @Get('kontrahenci')
  async getKontrahenci(@Req() req: Request) {
    return this.slownikiService.getKontrahenci(Number((req.user as any).id_organizacji));
  }

  @Get('miejsca')
  async getMiejsca(@Req() req: Request) {
    return this.slownikiService.getMiejsca(Number((req.user as any).id_organizacji));
  }

  @Get('uzytkownicy')
  async getUzytkownicy(@Req() req: Request) {
    return this.slownikiService.getUzytkownicy(Number((req.user as any).id_organizacji));
  }
}