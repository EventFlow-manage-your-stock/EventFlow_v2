import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { CrmService } from './crm.service';

@Controller('api/crm/kontrahenci')
@UseGuards(AuthGuard('jwt'))
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get()
  findAll(@Req() req: Request, @Query('search') search?: string) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.crmService.findAll(id_organizacji, search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.crmService.findOne(id, id_organizacji);
  }

  @Post()
  create(@Body() dto: any, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.crmService.create(dto, id_organizacji);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.crmService.update(id, dto, id_organizacji);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.crmService.remove(id, id_organizacji);
  }
}