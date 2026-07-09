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

  @Get('wszystkie-egzemplarze')
  async getWszystkieEgzemplarze(@Req() req: Request, @Query() query: any) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.getWszystkieEgzemplarze(id_organizacji, query);
  }

  @Get('modele')
  async getModele(@Req() req: Request, @Query() query: any) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.getModeleSprzetu(id_organizacji, query);
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
    const rawUserId = (req.user as any).id || (req.user as any).sub;
    const id_uzytkownika = rawUserId ? Number(rawUserId) : null;
    return this.magazynService.usunModelSoft(id, id_organizacji, id_uzytkownika as number);
  }

  @Get('slowniki/magazyny')
  async getMagazyny(@Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.getMagazyny(id_organizacji);
  }

  @Get('slowniki/cases')
  async getCases(@Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.getFizyczneCase(id_organizacji);
  }

  @Get('slowniki/dostepne-do-case/:id')
  async getDostepneDoCase(@Param('id', ParseIntPipe) id_case: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.getDostepneDoCase(id_organizacji, id_case);
  }

  @Get('opakowania')
  async getOpakowania(@Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.getListaOpakowan(id_organizacji);
  }

  @Get('egzemplarze/:id')
  async getEgzemplarzById(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.getEgzemplarzById(id, id_organizacji);
  }

  @Post('modele/:modelId/egzemplarze')
  async createEgzemplarz(@Param('modelId', ParseIntPipe) modelId: number, @Body() dto: any, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    const rawUserId = (req.user as any).id || (req.user as any).sub;
    const id_uzytkownika = rawUserId ? Number(rawUserId) : null;
    return this.magazynService.createEgzemplarz(modelId, dto, id_organizacji, id_uzytkownika as number);
  }

  @Put('egzemplarze/:id')
  async updateEgzemplarz(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    const rawUserId = (req.user as any).id || (req.user as any).sub;
    const id_uzytkownika = rawUserId ? Number(rawUserId) : null;
    return this.magazynService.updateEgzemplarz(id, dto, id_organizacji, id_uzytkownika as number);
  }

  @Delete('egzemplarze/:id')
  async deleteEgzemplarz(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    const rawUserId = (req.user as any).id || (req.user as any).sub;
    const id_uzytkownika = rawUserId ? Number(rawUserId) : null;
    return this.magazynService.deleteEgzemplarz(id, id_organizacji, id_uzytkownika as number);
  }

  @Post('egzemplarze/:id/zawartosc')
  async modyfikujZawartoscCase(
    @Param('id', ParseIntPipe) id_case: number, 
    @Body() body: { itemIds: number[], action: 'add' | 'remove' }, 
    @Req() req: Request
  ) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    const rawUserId = (req.user as any).id || (req.user as any).sub;
    const id_uzytkownika = rawUserId ? Number(rawUserId) : null;
    return this.magazynService.modyfikujZawartoscCase(id_case, body.itemIds, body.action, id_organizacji, id_uzytkownika as number);
  }

  @Get('cennik')
  async getCennikGlobalny(@Req() req: Request, @Query('kategoriaId') kategoriaId?: string, @Query('search') search?: string) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.getCennikGlobalny(
      id_organizacji, 
      kategoriaId ? parseInt(kategoriaId) : undefined,
      search
    );
  }

  @Put('cennik/masowo')
  async updateCenyMasowo(@Body() body: { updates: { id_modelu: number, cena: number | null }[] }, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.updateCenyMasowo(body.updates, id_organizacji);
  }

  @Post('modele/:modelId/stawki')
  async addStawka(@Param('modelId', ParseIntPipe) modelId: number, @Body() dto: any, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.addStawkaToModel(modelId, dto, id_organizacji);
  }

  @Put('stawki/:id')
  async updateStawka(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.updateStawka(id, dto, id_organizacji);
  }

  @Delete('stawki/:id')
  async deleteStawka(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.magazynService.deleteStawka(id, id_organizacji);
  }
}