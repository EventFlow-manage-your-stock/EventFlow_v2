// EVENTFLOW_PRODUCT_POLISH_V5: trasa bez prefiksu api, bo main.ts ustawia app.setGlobalPrefix('api').
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.dashboardService.getSummary(id_organizacji);
  }
}