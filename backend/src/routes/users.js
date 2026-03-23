const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth, adminAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET top players
router.get('/top', auth, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('name totalWin totalKills promoCode')
      .sort({ totalWin: -1 })
      .limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, inGameNames, socialLinks } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (inGameNames !== undefined) update.inGameNames = inGameNames.filter(n => n?.trim()).slice(0, 4);
    if (socialLinks !== undefined) update.socialLinks = socialLinks;
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT change password
router.put('/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: 'পুরনো পাসওয়ার্ড ভুল' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'পাসওয়ার্ড পরিবর্তন হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== ADMIN ROUTES =====
const adminRouter = require('express').Router();

// GET dashboard stats (admin) — MUST be before /:id
adminRouter.get('/stats/dashboard', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalMatches = await require('../models/Match').countDocuments();
    const pendingAddMoney = await Transaction.countDocuments({ type: 'addmoney', status: 'pending' });
    const pendingWithdraw = await Transaction.countDocuments({ type: 'withdraw', status: 'pending' });
    const pendingAddMoneyTotal = await Transaction.aggregate([
      { $match: { type: 'addmoney', status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pendingWithdrawTotal = await Transaction.aggregate([
      { $match: { type: 'withdraw', status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({
      totalUsers, totalMatches, pendingAddMoney, pendingWithdraw,
      pendingAddMoneyTotal: pendingAddMoneyTotal[0]?.total || 0,
      pendingWithdrawTotal: pendingWithdrawTotal[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all users
adminRouter.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single user (admin) - include password hash for credentials tab
adminRouter.get('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT edit user balance (admin)
adminRouter.put('/:id/balance', adminAuth, async (req, res) => {
  try {
    const { gamingBalance, winningBalance, note } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oldGaming = user.gamingBalance;
    const oldWinning = user.winningBalance;

    if (gamingBalance !== undefined) user.gamingBalance = gamingBalance;
    if (winningBalance !== undefined) user.winningBalance = winningBalance;
    await user.save();

    // Log transaction
    if (gamingBalance !== undefined && gamingBalance !== oldGaming) {
      await Transaction.create({
        user: user._id, type: 'admin_adjust',
        amount: Math.abs(gamingBalance - oldGaming),
        balanceType: 'gaming', status: 'approved',
        note: note || `Admin adjusted gaming balance: ${oldGaming} → ${gamingBalance}`
      });
    }
    if (winningBalance !== undefined && winningBalance !== oldWinning) {
      await Transaction.create({
        user: user._id, type: 'admin_adjust',
        amount: Math.abs(winningBalance - oldWinning),
        balanceType: 'winning', status: 'approved',
        note: note || `Admin adjusted winning balance: ${oldWinning} → ${winningBalance}`
      });
    }

    res.json({ message: 'Balance updated', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT suspend/activate user (admin)
adminRouter.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE user (admin)
adminRouter.delete('/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.adminRouter = adminRouter;

// ===== SUBADMIN MANAGEMENT (main admin only) =====

// GET all subadmins
adminRouter.get('/subadmins/list', adminAuth, async (req, res) => {
  try {
    const subadmins = await User.find({ role: 'subadmin' }).select('-password').sort({ createdAt: -1 });
    res.json(subadmins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create subadmin
adminRouter.post('/subadmins/create', adminAuth, async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name?.trim() || !phone?.trim() || !password)
      return res.status(400).json({ message: 'সব তথ্য দিন' });

    const exists = await User.findOne({ phone: phone.trim() });
    if (exists) return res.status(400).json({ message: 'এই ফোন নম্বর ইতিমধ্যে নিবন্ধিত' });

    const hashed = await bcrypt.hash(password, 10);
    const subadmin = new User({
      name: name.trim(), phone: phone.trim(),
      password: hashed, role: 'subadmin'
    });
    await subadmin.save();
    const obj = subadmin.toObject();
    delete obj.password;
    res.status(201).json({ message: 'Sub-admin তৈরি হয়েছে', user: obj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE subadmin
adminRouter.delete('/subadmins/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'subadmin')
      return res.status(404).json({ message: 'Sub-admin পাওয়া যায়নি' });
    await user.deleteOne();
    res.json({ message: 'Sub-admin মুছে ফেলা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.adminRouter = adminRouter;
