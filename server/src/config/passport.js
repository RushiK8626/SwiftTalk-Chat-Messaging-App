const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: GitHubStrategy } = require('passport-github2');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Shared logic for all OAuth providers 

async function handleOAuthUser({ provider, provider_id, email, full_name, profile_pic }) {
    // 1. Account exists → user exists, just return the user
    const existingAccount = await prisma.account.findUnique({
        where: { provider_provider_id: { provider, provider_id } },
        include: { user: true },
    });
    if (existingAccount) return existingAccount.user;

    // 2. User exists (by email) but no account for this provider → link it
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        await prisma.account.create({
            data: { user_id: existingUser.user_id, provider, provider_id },
        });
        return existingUser;
    }

    // 3. Neither exists → create user + account together
    const username = await generateUniqueUsername(full_name);

    const user = await prisma.user.create({
        data: {
            username,
            email,
            full_name,
            profile_pic,
            accounts: {
                create: { provider, provider_id },
            },
        },
    });

    return user;
}

// Generates username using name and random number, retries on collision
async function generateUniqueUsername(full_name) {
    const base = (full_name ?? 'user')
        .toLowerCase()
        .replace(/\s+/g, '_')      // spaces → underscore
        .replace(/[^a-z0-9_]/g, '') // strip special chars
        .slice(0, 20);              // keep it reasonable

    let username, exists;
    do {
        const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random
        username = `${base}_${suffix}`;
        exists = await prisma.user.findUnique({ where: { username } });
    } while (exists);

    return username;
}

// Google
passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await handleOAuthUser({
                provider: 'google',
                provider_id: profile.id,
                email: profile.emails[0].value,
                full_name: profile.displayName,
                profile_pic: profile.photos?.[0]?.value ?? null,
            });
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));

// GitHub
passport.use(new GitHubStrategy(
    {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],  // needed to get private emails
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // GitHub may return multiple emails; pick the primary verified one
            const emailObj = profile.emails?.find(e => e.primary && e.verified)
                ?? profile.emails?.[0];

            if (!emailObj?.value) return done(new Error('GitHub email not available'), null);

            const user = await handleOAuthUser({
                provider: 'github',
                provider_id: String(profile.id),
                email: emailObj.value,
                full_name: profile.displayName ?? profile.username,
                profile_pic: profile.photos?.[0]?.value ?? null,
            });
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));

passport.serializeUser((user, done) => done(null, user.user_id));
passport.deserializeUser(async (id, done) => {
    const user = await prisma.user.findUnique({ where: { user_id: id } });
    done(null, user);
});

module.exports = passport;