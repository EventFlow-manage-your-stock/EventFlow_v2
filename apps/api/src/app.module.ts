import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WydarzeniaModule } from './wydarzenia/wydarzenia.module';
import { TenantMiddleware } from './prisma/tenant.middleware';
import { SlownikiModule } from './slowniki/slowniki.module';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,
    }),PrismaModule, AuthModule, WydarzeniaModule, SlownikiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/auth/login', method: RequestMethod.POST },
        { path: 'api/auth/register', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
