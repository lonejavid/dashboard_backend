import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [DatabaseModule, DashboardModule],
})
export class AppModule {}
