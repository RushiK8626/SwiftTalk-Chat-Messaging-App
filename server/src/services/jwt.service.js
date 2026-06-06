const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.generateAccessToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

exports.generateTokens = async (user) => {
  const accessToken = exports.generateAccessToken(user);
  const refreshToken = exports.generateRefreshToken(user);

  await prisma.auth.upsert({
    where: { user_id: user.user_id },
    update: { refresh_token: refreshToken },
    create: { user_id: user.user_id, refresh_token: refreshToken },
  });

  return { accessToken, refreshToken };
};

exports.verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

exports.refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = exports.verifyRefreshToken(refreshToken);

    const auth = await prisma.auth.findFirst({
      where: {
        user_id: decoded.user_id,
        refresh_token: refreshToken
      },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            full_name: true
          }
        }
      }
    });

    if (!auth) {
      throw new Error('Invalid refresh token');
    }

    const accessToken = exports.generateAccessToken(auth.user);

    return { accessToken, user: auth.user };
  } catch (error) {
    throw new Error('Failed to refresh token');
  }
};

exports.revokeRefreshToken = async (userId) => {
  try {
    await prisma.auth.update({
      where: { user_id: userId },
      data: { refresh_token: null }
    });
    return true;
  } catch (error) {
    throw new Error('Failed to revoke token');
  }
};