import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { WynajmyService } from './wynajmy.service';

@Controller('wynajmy')
@UseGuards(AuthGuard('jwt'))
export class WynajmyController {
  constructor(private readonly service: WynajmyService) {}

  @Get()
  findAll(@Req() req: Request) { return this.service.findAll(Number((req.user as any).id_organizacji)); }
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) { return this.service.findOne(id, Number((req.user as any).id_organizacji)); }
  @Post()
  create(@Body() dto: any, @Req() req: Request) { return this.service.create(dto, Number((req.user as any).id_organizacji)); }
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: Request) { return this.service.update(id, dto, Number((req.user as any).id_organizacji)); }
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) { return this.service.remove(id, Number((req.user as any).id_organizacji)); }
  @Post(':id/pozycje')
  addPozycja(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: Request) { return this.service.addPozycja(id, dto, Number((req.user as any).id_organizacji)); }
}
