const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const bookRoutes = require('./bookRoutes');
const categoryRoutes = require('./categoryRoutes');
const progressRoutes = require('./progressRoutes');
const adminRoutes = require('./adminRoutes');
const bookshelfRoutes = require('./bookshelfRoutes');
const bookmarkRoutes = require('./bookmarkRoutes');
const historyRoutes = require('./historyRoutes');
const tagRoutes = require('./tagRoutes');
const highlightRoutes = require('./highlightRoutes');
const noteRoutes = require('./noteRoutes');
const reviewRoutes = require('./reviewRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const reportRoutes = require('./reportRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/categories', categoryRoutes);
router.use('/progress', progressRoutes);
router.use('/admin', adminRoutes);
router.use('/bookshelf', bookshelfRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/history', historyRoutes);
router.use('/tags', tagRoutes);
router.use('/highlights', highlightRoutes);
router.use('/notes', noteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
