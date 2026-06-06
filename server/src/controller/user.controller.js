const userCacheService = require('../services/user-cache.service');

exports.searchUsersPublic = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    if (!query || query.trim() === '') return res.status(400).json({ error: 'Query parameter is required' });
    const pageNum = parseInt(page) > 0 ? parseInt(page) : 1;
    const limitNum = parseInt(limit) > 0 ? parseInt(limit) : 10;
    const skip = (pageNum - 1) * limitNum;

    const users = await prisma.user.findMany({
      where: { OR: [{ username: { contains: query } }, { full_name: { contains: query } }] },
      select: { user_id: true, username: true, full_name: true, profile_pic: true, status_message: true, is_online: true, last_seen: true },
      skip,
      take: limitNum
    });

    const total = await prisma.user.count({ where: { OR: [{ username: { contains: query } }, { full_name: { contains: query } }] } });

    res.json({ users, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search users' });
  }
};
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userCacheService.getUserProfile(parseInt(id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, username, status_message, profile_pic } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { user_id: parseInt(id) } });
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    const updatedUser = await prisma.user.update({
      where: { user_id: parseInt(id) },
      data: {
        ...(full_name && { full_name }),
        ...(username && { username }),
        ...(status_message !== undefined && { status_message }),
        ...(profile_pic !== undefined && { profile_pic })
      },
      select: { user_id: true, username: true, full_name: true, profile_pic: true, status_message: true, created_at: true }
    });

    await userCacheService.invalidateUserProfile(parseInt(id));
    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};



exports.blockUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { blockedUserId } = req.body;
    if (userId === blockedUserId) return res.status(400).json({ error: 'Cannot block yourself' });

    const blockedUser = await prisma.blockedUser.create({ data: { user_id: userId, blocked_user_id: parseInt(blockedUserId) } });
    res.json({ message: 'User blocked successfully', blockedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const blockedUserId = parseInt(req.params.blockedUserId);

    await prisma.blockedUser.delete({ where: { user_id_blocked_user_id: { user_id: userId, blocked_user_id: blockedUserId } } });
    res.json({ message: 'User unblocked successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const blockedUsers = await prisma.blockedUser.findMany({
      where: { user_id: userId },
      include: { blockedUser: { select: { user_id: true, username: true, full_name: true, profile_pic: true } } }
    });
    res.json(blockedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkBlockStatus = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const otherUserId = parseInt(req.params.otherUserId);
    if (userId === otherUserId) return res.status(400).json({ error: 'Cannot check block status with same user' });

    const currentUserBlocked = await prisma.blockedUser.findUnique({ where: { user_id_blocked_user_id: { user_id: userId, blocked_user_id: otherUserId } } });
    const otherUserBlocked = await prisma.blockedUser.findUnique({ where: { user_id_blocked_user_id: { user_id: otherUserId, blocked_user_id: userId } } });

    res.json({ currentUserBlockedOther: !!currentUserBlocked, otherUserBlockedCurrent: !!otherUserBlocked, isBlocked: !!currentUserBlocked || !!otherUserBlocked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};





exports.getPublicUserProfile = async (req, res) => {
  try {
    const { username, id } = req.params;
    let user;
    const selectFields = { user_id: true, username: true, full_name: true, profile_pic: true, status_message: true, is_online: true, last_seen: true, created_at: true };
    if (username) {
      user = await prisma.user.findUnique({ where: { username }, select: selectFields });
    } else if (id) {
      user = await prisma.user.findUnique({ where: { user_id: parseInt(id) }, select: selectFields });
    } else {
      return res.status(400).json({ error: 'Username or ID required' });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get public user profile' });
  }
};
