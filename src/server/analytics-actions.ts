import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '#/db/index'
import { pageViews as pageViewsTable, visitors as visitorsTable } from '#/db/schema'
import { sql, desc, gte, eq } from 'drizzle-orm'
import { requireAdminSession } from '#/lib/admin-auth'
import { isPostgres } from '#/db/dialect'

// Helper to hash IP for privacy
async function hashIp(ip: string, userAgent: string) {
  const msgUint8 = new TextEncoder().encode(ip + userAgent);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const trackPageView = createServerFn({ method: 'POST' })
  .inputValidator((data: { 
    url: string, 
    pathname: string, 
    referrer: string | null,
    browser: string | null,
    os: string | null,
    device: string | null
  }) => data)
  .handler(async ({ data }: { data: any }) => {
    const request = getRequest();
    const headers = request?.headers;
    const ip = headers?.get('cf-connecting-ip') || headers?.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = headers?.get('user-agent') || 'unknown';
    
    const visitorId = await hashIp(ip, userAgent);

    try {
      const visitorExists = await db.select().from(visitorsTable).where(eq(visitorsTable.id, visitorId)).limit(1);
      
      if (visitorExists.length > 0) {
        await db.update(visitorsTable).set({ lastSeenAt: new Date() }).where(eq(visitorsTable.id, visitorId));
      } else {
        await db.insert(visitorsTable).values({ id: visitorId, lastSeenAt: new Date(), createdAt: new Date() });
      }

      // Insert page view
      await db.insert(pageViewsTable).values({
        visitorId,
        url: data.url,
        pathname: data.pathname,
        referrer: data.referrer,
        userAgent,
        browser: data.browser,
        os: data.os,
        device: data.device,
        timestamp: new Date(),
      });
    } catch (e) {
      console.error('Failed to track page view:', e);
    }

    return { success: true };
  })

export const getAnalyticsStats = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdminSession();
    
    // Total Views
    const totalViewsRes = await db.select({ count: sql`count(*)` }).from(pageViewsTable);
    const totalViews = Number(totalViewsRes[0]?.count || 0);
    
    // Unique Visitors
    const totalVisitorsRes = await db.select({ count: sql`count(*)` }).from(visitorsTable);
    const totalVisitors = Number(totalVisitorsRes[0]?.count || 0);

    // Views per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dateSql = isPostgres 
      ? sql`DATE_TRUNC('day', ${pageViewsTable.timestamp})`
      : sql`date(${pageViewsTable.timestamp}, 'unixepoch')`;

    const viewsPerDay = await db.select({
      date: dateSql,
      count: sql`count(*)`
    })
    .from(pageViewsTable)
    .where(gte(pageViewsTable.timestamp, thirtyDaysAgo))
    .groupBy(dateSql)
    .orderBy(dateSql);

    // Top Pages
    const topPages = await db.select({
      pathname: pageViewsTable.pathname,
      count: sql`count(*)`
    })
    .from(pageViewsTable)
    .groupBy(pageViewsTable.pathname)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

    // Browsers
    const browsers = await db.select({
      name: pageViewsTable.browser,
      count: sql`count(*)`
    })
    .from(pageViewsTable)
    .groupBy(pageViewsTable.browser)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

    // Devices
    const devices = await db.select({
      name: pageViewsTable.device,
      count: sql`count(*)`
    })
    .from(pageViewsTable)
    .groupBy(pageViewsTable.device)
    .orderBy(desc(sql`count(*)`));

    return {
      totalViews,
      totalVisitors,
      viewsPerDay,
      topPages,
      browsers,
      devices
    };
  })
