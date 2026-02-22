import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AppController } from './app.controller';

@Module({
  imports: [DatabaseModule, DashboardModule],
  controllers: [AppController],
})
export class AppModule {}
