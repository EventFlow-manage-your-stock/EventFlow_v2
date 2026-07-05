import { Controller, Get, Request } from '@nestjs/common';
import { SlownikiService } from './slowniki.service';

@Controller('api/slowniki')
export class SlownikiController {
  constructor(private readonly slownikiService: SlownikiService) {}

  @Get('statusy-wydarzenia')
  async getStatusyWydarzenia(@Request() req: any) {
    // Wstrzyknięcie id_organizacji z JWT requestu do serwisu
    return this.slownikiService.getStatusyWydarzenia(req.user.id_organizacji);
  }

  @Get('kontrahenci')
  async getKontrahenci(@Request() req: any) {
    return this.slownikiService.getKontrahenci(req.user.id_organizacji);
  }

  @Get('miejsca')
  async getMiejsca(@Request() req: any) {
    return this.slownikiService.getMiejsca(req.user.id_organizacji);
  }
}