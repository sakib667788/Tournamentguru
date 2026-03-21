const router = require('express').Router();
const Match = require('../models/Match');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, adminAuth, adminOrSubAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../utils/cloudinary');

// GET all matches (user)
router.get('/', auth, async (req, res) => {
  try {
    const { game, status, mode } = req.query;
    const filter = {};
    if (game) filter.game = game;
    if (status) filter.status = status;
    if (mode) filter.gameMode = mode;
    const matches = await Match.find(filter).sort({ createdAt: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET user match history
router.get('/user/history', auth, async (req, res) => {
  try {
    const matches = await Match.find({ 'players.user': req.user._id }).sort({ createdAt: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single match
router.get('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id).populate('players.user', 'name phone promoCode');
    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST join match
router.post('/:id/join', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'ম্যাচ পাওয়া যায়নি' });
    if (match.status !== 'upcoming') return res.status(400).json({ message: 'ম্যাচ এখন join করা যাবে না' });
    if (match.players.length >= match.maxSlots) return res.status(400).json({ message: 'ম্যাচ ফুল হয়ে গেছে' });

    const alreadyJoined = match.players.find(p => p.user.toString() === req.user._id.toString());
    if (alreadyJoined) return res.status(400).json({ message: 'আপনি ইতিমধ্যে এই ম্যাচে যোগ দিয়েছেন' });

    const { ffUid, playerNames } = req.body;
    if (!ffUid?.trim()) return res.status(400).json({ message: 'Free Fire UID দিন' });

    // Validate player names based on entry type
    const requiredPlayers = match.entryType === 'Squad' ? 4 : match.entryType === 'Duo' ? 2 : 1;
    if (!playerNames || playerNames.length < requiredPlayers || playerNames.some(n => !n?.trim())) {
      return res.status(400).json({ message: `${requiredPlayers} জন player এর in-game নাম দিন` });
    }

    const uidTaken = match.players.find(p => p.ffUid === ffUid.trim());
    if (uidTaken) return res.status(400).json({ message: 'এই Free Fire UID দিয়ে ইতিমধ্যে কেউ যোগ দিয়েছে' });

    const user = await User.findById(req.user._id);
    if (user.gamingBalance < match.entryFee) return res.status(400).json({ message: 'পর্যাপ্ত Gaming Balance নেই' });

    user.gamingBalance -= match.entryFee;
    if (!user.ffUid) { user.ffUid = ffUid.trim(); }
    await user.save();

    match.players.push({ user: req.user._id, ffUid: ffUid.trim(), playerNames: playerNames || [] });
    await match.save();

    await Transaction.create({
      user: req.user._id, type: 'match_fee', amount: match.entryFee,
      balanceType: 'gaming', status: 'approved', match: match._id,
      note: `Match #${match.matchNumber} - ${match.title} এ যোগ দেওয়া`
    });

    res.json({ message: 'সফলভাবে ম্যাচে যোগ দিয়েছেন', match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST submit result screenshot
router.post('/:id/result', auth, upload.single('screenshot'), async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'ম্যাচ পাওয়া যায়নি' });

    const playerIndex = match.players.findIndex(p => p.user.toString() === req.user._id.toString());
    if (playerIndex === -1) return res.status(400).json({ message: 'আপনি এই ম্যাচে নেই' });
    if (!req.file) return res.status(400).json({ message: 'Screenshot দিন' });

    const result = await uploadToCloudinary(req.file.buffer, 'tournament-guru/results');
    match.players[playerIndex].resultScreenshot = result.secure_url;
    match.players[playerIndex].resultStatus = 'submitted';
    await match.save();

    res.json({ message: 'Screenshot জমা দেওয়া হয়েছে। Admin রিভিউ করবেন।' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== ADMIN ROUTES =====

router.post('/', adminOrSubAuth, async (req, res) => {
  try {
    const match = new Match(req.body);
    await match.save();
    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', adminOrSubAuth, async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE match — কোনো refund নেই
router.delete('/:id', adminOrSubAuth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    await match.deleteOne();
    res.json({ message: 'Match deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST cancel match — শুধু joined players রা refund পাবে
router.post('/:id/cancel', adminOrSubAuth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const joinedPlayers = [...match.players];
    match.status = 'cancelled';
    await match.save();

    for (const player of joinedPlayers) {
      if (match.entryFee > 0) {
        await User.findByIdAndUpdate(player.user, { $inc: { gamingBalance: match.entryFee } });
        await Transaction.create({
          user: player.user, type: 'refund', amount: match.entryFee,
          balanceType: 'gaming', status: 'approved', match: match._id,
          note: `Match #${match.matchNumber} বাতিল - Refund`
        });
      }
    }

    await Notification.create({
      title: 'ম্যাচ বাতিল',
      message: `Match #${match.matchNumber} "${match.title}" বাতিল হয়েছে। Entry fee ফেরত দেওয়া হয়েছে।`,
      type: 'global'
    });

    res.json({ message: 'Match cancelled and players refunded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST exit player (admin) — player বের করো + refund
router.post('/:matchId/players/:userId/exit', adminOrSubAuth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const playerIndex = match.players.findIndex(p => p.user.toString() === req.params.userId);
    if (playerIndex === -1) return res.status(404).json({ message: 'Player not found' });

    match.players.splice(playerIndex, 1);
    await match.save();

    if (match.entryFee > 0) {
      await User.findByIdAndUpdate(req.params.userId, { $inc: { gamingBalance: match.entryFee } });
      await Transaction.create({
        user: req.params.userId, type: 'refund', amount: match.entryFee,
        balanceType: 'gaming', status: 'approved', match: match._id,
        note: `Match #${match.matchNumber} থেকে বের করা হয়েছে - Refund`
      });
    }

    res.json({ message: 'Player exited and refunded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST approve result (admin)
router.post('/:matchId/players/:userId/approve', adminOrSubAuth, async (req, res) => {
  try {
    const { kills, position, prize } = req.body;
    const match = await Match.findById(req.params.matchId);
    const playerIndex = match.players.findIndex(p => p.user.toString() === req.params.userId);
    if (playerIndex === -1) return res.status(404).json({ message: 'Player not found' });

    match.players[playerIndex].kills = kills || 0;
    match.players[playerIndex].position = position || 0;
    match.players[playerIndex].prize = prize || 0;
    match.players[playerIndex].resultStatus = 'approved';
    await match.save();

    if (prize > 0) {
      await User.findByIdAndUpdate(req.params.userId, {
        $inc: { winningBalance: prize, totalWin: prize, totalKills: kills || 0 }
      });
      await Transaction.create({
        user: req.params.userId, type: 'prize', amount: prize,
        balanceType: 'winning', status: 'approved', match: match._id,
        note: `Match #${match.matchNumber} Prize - Position: ${position}, Kills: ${kills}`
      });
    }

    res.json({ message: 'Result approved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
