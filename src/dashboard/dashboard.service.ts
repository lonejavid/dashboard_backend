import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface DashboardFilters {
  from?: string;
  to?: string;
  plan?: string;
  provider?: string;
  status?: string;
  subscription?: string;
}

@Injectable()
export class DashboardService {
  constructor(private db: DatabaseService) {}

  private baseWhere(f: DashboardFilters): { sql: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 0;
    if (f.from) {
      i++;
      conditions.push(`u."createdAt" >= $${i}`);
      params.push(f.from);
    }
    if (f.to) {
      i++;
      conditions.push(`u."createdAt" <= $${i}`);
      params.push(f.to);
    }
    if (f.plan && f.plan !== 'all') {
      i++;
      conditions.push(`u.plan = $${i}`);
      params.push(f.plan);
    }
    if (f.provider && f.provider !== 'all') {
      i++;
      conditions.push(`u.provider::text = $${i}`);
      params.push(f.provider);
    }
    if (f.subscription && f.subscription !== 'all') {
      i++;
      conditions.push(`u."subscriptionStatus"::text = $${i}`);
      params.push(f.subscription);
    }
    const sql = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    return { sql, params };
  }

  async getSummary(filters: DashboardFilters) {
    const { sql, params } = this.baseWhere(filters);
    const query = `
      SELECT
        COUNT(*)::int AS "totalUsers",
        COUNT(*) FILTER (WHERE plan::text = 'pro')::int AS "proUsers",
        COUNT(*) FILTER (WHERE plan::text = 'free')::int AS "freeUsers",
        COUNT(*) FILTER (WHERE u."lastLoginAt" >= NOW() - INTERVAL '30 days' OR EXISTS (
          SELECT 1 FROM scans s WHERE s."userId" = u.id AND s."createdAt" >= NOW() - INTERVAL '30 days'
        ))::int AS "activeUsers",
        COUNT(*) FILTER (WHERE u."createdAt" >= date_trunc('month', CURRENT_DATE))::int AS "signupsThisMonth",
        COUNT(*) FILTER (WHERE u."createdAt" >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
          AND u."createdAt" < date_trunc('month', CURRENT_DATE))::int AS "signupsLastMonth"
      FROM users u
      ${sql}
    `;
    const { rows } = await this.db.query<{
      totalUsers: number;
      proUsers: number;
      freeUsers: number;
      activeUsers: number;
      signupsThisMonth: number;
      signupsLastMonth: number;
    }>(query, params);
    const r = rows[0];
    const total = r?.totalUsers ?? 0;
    const thisMonth = r?.signupsThisMonth ?? 0;
    const lastMonth = r?.signupsLastMonth ?? 0;
    const signupGrowthPercent =
      lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10 : (thisMonth > 0 ? 100 : 0);
    return {
      totalUsers: r?.totalUsers ?? 0,
      proUsers: r?.proUsers ?? 0,
      freeUsers: r?.freeUsers ?? 0,
      activeUsers: r?.activeUsers ?? 0,
      signupsThisMonth: thisMonth,
      signupsLastMonth: lastMonth,
      signupGrowthPercent,
      proPercent: total ? Math.round(((r?.proUsers ?? 0) / total) * 1000) / 10 : 0,
      freePercent: total ? Math.round(((r?.freeUsers ?? 0) / total) * 1000) / 10 : 0,
      activeRatePercent: total ? Math.round(((r?.activeUsers ?? 0) / total) * 1000) / 10 : 0,
    };
  }

  async getSignupsOverTime(filters: DashboardFilters) {
    const { sql, params } = this.baseWhere(filters);
    const query = `
      SELECT
        date_trunc('month', u."createdAt") AS month,
        COUNT(*)::int AS count
      FROM users u
      ${sql}
      GROUP BY date_trunc('month', u."createdAt")
      ORDER BY month
    `;
    const { rows } = await this.db.query<{ month: Date; count: number }>(query, params);
    return rows.map((r) => ({ month: r.month, count: r.count }));
  }

  async getPlanDistribution(filters: DashboardFilters) {
    const { sql, params } = this.baseWhere(filters);
    const query = `
      SELECT plan::text AS plan, COUNT(*)::int AS count
      FROM users u
      ${sql}
      GROUP BY plan
      ORDER BY count DESC
    `;
    const { rows } = await this.db.query<{ plan: string; count: number }>(query, params);
    const total = rows.reduce((s, r) => s + r.count, 0);
    return rows.map((r) => ({
      plan: r.plan,
      count: r.count,
      percent: total ? Math.round((r.count / total) * 1000) / 10 : 0,
    }));
  }

  async getSignupProvider(filters: DashboardFilters) {
    const { sql, params } = this.baseWhere(filters);
    const query = `
      SELECT provider::text AS provider, COUNT(*)::int AS count
      FROM users u
      ${sql}
      GROUP BY provider
      ORDER BY count DESC
    `;
    const { rows } = await this.db.query<{ provider: string; count: number }>(query, params);
    const total = rows.reduce((s, r) => s + r.count, 0);
    return rows.map((r) => ({
      provider: r.provider === 'google' ? 'Google' : 'Local / Email',
      count: r.count,
      percent: total ? Math.round((r.count / total) * 100) : 0,
    }));
  }

  async getFreeTrialStats(filters: DashboardFilters) {
    const { sql, params } = this.baseWhere(filters);
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE "freeTrialClaimed" = true)::int AS claimed,
        COUNT(*) FILTER (WHERE "freeTrialClaimed" = false)::int AS notClaimed
      FROM users u
      ${sql}
    `;
    const { rows } = await this.db.query<{ claimed: number; notClaimed: number }>(query, params);
    const r = rows[0];
    const claimed = r?.claimed ?? 0;
    const notClaimed = r?.notClaimed ?? 0;
    const total = claimed + notClaimed;
    return [
      { label: 'Claimed', count: claimed, percent: total ? Math.round((claimed / total) * 100) : 0 },
      { label: 'Not Claimed', count: notClaimed, percent: total ? Math.round((notClaimed / total) * 100) : 0 },
    ];
  }

  async getSubscriptionStatus(filters: DashboardFilters) {
    const { sql, params } = this.baseWhere(filters);
    const query = `
      SELECT "subscriptionStatus"::text AS status, COUNT(*)::int AS count
      FROM users u
      ${sql}
      GROUP BY "subscriptionStatus"
      ORDER BY count DESC
    `;
    const { rows } = await this.db.query<{ status: string; count: number }>(query, params);
    return rows.map((r) => ({ status: r.status, count: r.count }));
  }

  async getRecentSignups(filters: DashboardFilters, limit = 10) {
    const { sql, params } = this.baseWhere(filters);
    const limitParam = params.length + 1;
    const query = `
      SELECT id, name, email, "createdAt", plan::text AS plan
      FROM users u
      ${sql}
      ORDER BY "createdAt" DESC
      LIMIT $${limitParam}
    `;
    const { rows } = await this.db.query<{ id: string; name: string | null; email: string; createdAt: Date; plan: string }>(
      query,
      [...params, limit],
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name || r.email,
      date: r.createdAt,
      plan: r.plan,
    }));
  }

  async getReferralCredits(filters: DashboardFilters) {
    const { sql, params } = this.baseWhere(filters);
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE "referralCode" IS NOT NULL AND "referralCode" != '')::int AS "usersWithReferralCode",
        COUNT(*) FILTER (WHERE "referralRewardGrantedAt" IS NOT NULL)::int AS "referralRewardsGranted",
        COALESCE(AVG(credits) FILTER (WHERE credits IS NOT NULL), 0)::numeric(10,2) AS "avgCreditsPerUser"
      FROM users u
      ${sql}
    `;
    const { rows } = await this.db.query<{
      usersWithReferralCode: number;
      referralRewardsGranted: number;
      avgCreditsPerUser: string;
    }>(query, params);
    const r = rows[0];
    return {
      usersWithReferralCode: r?.usersWithReferralCode ?? 0,
      referralRewardsGranted: r?.referralRewardsGranted ?? 0,
      avgCreditsPerUser: Math.round(parseFloat(r?.avgCreditsPerUser ?? '0') * 100) / 100,
    };
  }

  async getPlatformStats() {
    const [scans, scansLast30, spam, trusted, userCount] = await Promise.all([
      this.db.query<{ total: string }>('SELECT COUNT(*) AS total FROM scans'),
      this.db.query<{ total: string }>(
        "SELECT COUNT(*) AS total FROM scans WHERE \"createdAt\" >= NOW() - INTERVAL '30 days'",
      ),
      this.db.query<{ total: string }>('SELECT COUNT(*) AS total FROM spam_urlsv2'),
      this.db.query<{ total: string }>('SELECT COUNT(*) AS total FROM trusted_urlsv2'),
      this.db.query<{ total: string }>('SELECT COUNT(*) AS total FROM users'),
    ]);
    const totalScans = parseInt(scans.rows[0]?.total ?? '0', 10);
    const totalUsers = parseInt(userCount.rows[0]?.total ?? '1', 10);
    return {
      totalScans,
      scansLast30Days: parseInt(scansLast30.rows[0]?.total ?? '0', 10),
      avgScansPerUser: totalUsers ? Math.round((totalScans / totalUsers) * 10) / 10 : 0,
      spamDomainsBlocked: parseInt(spam.rows[0]?.total ?? '0', 10),
      trustedDomains: parseInt(trusted.rows[0]?.total ?? '0', 10),
    };
  }

  async getDashboard(filters: DashboardFilters) {
    const [
      summary,
      signupsOverTime,
      planDistribution,
      signupProvider,
      freeTrial,
      subscriptionStatus,
      recentSignups,
      referralCredits,
      platformStats,
    ] = await Promise.all([
      this.getSummary(filters),
      this.getSignupsOverTime(filters),
      this.getPlanDistribution(filters),
      this.getSignupProvider(filters),
      this.getFreeTrialStats(filters),
      this.getSubscriptionStatus(filters),
      this.getRecentSignups(filters),
      this.getReferralCredits(filters),
      this.getPlatformStats(),
    ]);
    return {
      summary,
      signupsOverTime,
      planDistribution,
      signupProvider,
      freeTrial,
      subscriptionStatus,
      recentSignups,
      referralCredits,
      platformStats,
      lastSynced: new Date().toISOString(),
    };
  }
}
