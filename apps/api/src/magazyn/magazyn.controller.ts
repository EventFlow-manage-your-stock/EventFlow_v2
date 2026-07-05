import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { MagazynService } from './magazyn.service';

@Controller('api/magazyn')
@UseGuards(AuthGuard('jwt'))
export class MagazynController {
  constructor(private readonly magazynService: MagazynService) {}

  @Get('kategorie')
  async getKategorie(@Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.getKategorie(id_organizacji);
  }

  @Get('modele')
  async getModele(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('kategoriaId') kategoriaId?: string,
    @Query('search') search?: string,
  ) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.getModeleSprzetu(
      id_organizacji,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      kategoriaId ? parseInt(kategoriaId) : undefined,
      search
    );
  }

  @Post('modele')
  async createModel(@Body() dto: any, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.createModelSprzetu(dto, id_organizacji);
  }

  @Get('modele/:id')
  async getModelById(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.getModelById(id, id_organizacji);
  }

  @Put('modele/:id')
  async updateModel(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.updateModel(id, dto, id_organizacji);
  }

  @Delete('modele/:id')
  async deleteModel(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.deleteModel(id, id_organizacji);
  }
}