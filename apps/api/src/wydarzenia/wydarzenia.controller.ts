import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { WydarzeniaService } from './wydarzenia.service';

@Controller('api/wydarzenia')
@UseGuards(AuthGuard('jwt'))
export class WydarzeniaController {
  constructor(private readonly wydarzeniaService: WydarzeniaService) {}

  @Get('slowniki-filtrow')
  getSlownikiFiltrow(@Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.wydarzeniaService.getSlownikiDoFiltrow(id_organizacji);
  }

  @Post('powiadomienia/masowe')
  wyslijPowiadomienia(@Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    const id_uzytkownika = Number((req.user as any).id);
    return this.wydarzeniaService.wyslijPowiadomieniaMasowe(id_organizacji, id_uzytkownika);
  }

  @Get()
  findAll(@Req() req: Request, @Query() query: any) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.wydarzeniaService.findAll(id_organizacji, query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.wydarzeniaService.findOne(id, id_organizacji);
  }

  @Post()
  create(@Body() dto: any, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    const id_uzytkownika = Number((req.user as any).id);
    return this.wydarzeniaService.create(dto, id_organizacji, id_uzytkownika);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    const id_uzytkownika = Number((req.user as any).id);
    return this.wydarzeniaService.update(id, dto, id_organizacji, id_uzytkownika);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    const id_uzytkownika = Number((req.user as any).id);
    return this.wydarzeniaService.remove(id, id_organizacji, id_uzytkownika);
  }
}