import { 
  Controller, Get, Post, Put, Delete, 
  Body, Param, Req, UseGuards, ParseIntPipe 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { WydarzeniaService } from './wydarzenia.service';
import { CreateWydarzenieDto } from './dto/create-wydarzenie.dto';

@Controller('events')
@UseGuards(AuthGuard('jwt')) // Zabezpieczamy cały kontroler
export class WydarzeniaController {
  constructor(private readonly wydarzeniaService: WydarzeniaService) {}

  @Get()
  findAll(@Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.wydarzeniaService.findAll(id_organizacji);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    return this.wydarzeniaService.findOne(id, id_organizacji);
  }

  @Post()
  create(@Req() req: Request, @Body() createWydarzenieDto: CreateWydarzenieDto) {
    // Mamy pewność, że req.user istnieje dzięki AuthGuard
    const id_organizacji = Number((req.user as any).id_organizacji);
    const id_uzytkownika = Number((req.user as any).id); 
    
    return this.wydarzeniaService.create(createWydarzenieDto, id_organizacji, id_uzytkownika);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Req() req: Request, 
    @Body() updateWydarzenieDto: Partial<CreateWydarzenieDto>
  ) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    const id_uzytkownika = Number((req.user as any).id); 

    return this.wydarzeniaService.update(id, updateWydarzenieDto, id_organizacji, id_uzytkownika);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const id_organizacji = Number((req.user as any).id_organizacji);
    const id_uzytkownika = Number((req.user as any).id);

    return this.wydarzeniaService.remove(id, id_organizacji, id_uzytkownika);
  }
}