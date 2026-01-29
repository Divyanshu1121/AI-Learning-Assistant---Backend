const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const User = require('../models/User');

// @desc    Upgrade to Pro (Dummy Payment)
// @route   POST /api/payment/upgrade
// @access  Private
router.post('/upgrade', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        user.plan = 'pro';
        user.subscriptionDate = Date.now();
        await user.save();

        res.json({
            success: true,
            message: 'Successfully upgraded to Pro Plan!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
