import { Controller, Get, Query } from '@nestjs/common';
import { DashboardFilters } from './dashboard.service';
import { DashboardService } from './dashboard.service';

@Controller('api')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('dashboard')
  async getDashboard(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('plan') plan?: string,
    @Query('provider') provider?: string,
    @Query('status') status?: string,
    @Query('subscription') subscription?: string,
  ) {
    const filters: DashboardFilters = {
      from: from || undefined,
      to: to || undefined,
      plan: plan || undefined,
      provider: provider || undefined,
      status: status || undefined,
      subscription: subscription || undefined,
    };
    return this.dashboard.getDashboard(filters);
  }
}
