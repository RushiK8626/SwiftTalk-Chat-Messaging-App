const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

// Reuse global Prisma instance if available, otherwise create new one
let prisma = null;

function initSessionCleanupCron() {
  // Initialize Prisma client if not already done
  if (!prisma) {
    prisma = new PrismaClient();
  }

  // '0 * * * *' means this runs at minute 0 of every single hour
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    console.log(`[Cron] Starting AI session cleanup at ${now.toISOString()}`);

    try {
      // Ensure prisma client is connected
      if (!prisma) {
        prisma = new PrismaClient();
      }

      const result = await prisma.aISession.deleteMany({
        where: {
          expires_at: {
            lt: now,
          },
        },
      });

      if (result.count > 0) {
        console.log(`[Cron] Successfully purged ${result.count} expired AI sessions.`);
      }
    } catch (error) {
      console.error('[Cron Error] Failed to clean up AI sessions:', error.message);
    }
  });

  console.log('[Cron] AI Session Auto-Cleanup initialized (Running hourly).');
}

module.exports = { initSessionCleanupCron };