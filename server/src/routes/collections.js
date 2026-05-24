const express = require('express');
const router = express.Router();
const { getCollections, createCollection, deleteCollection } = require('../controllers/collectionsController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getCollections);
router.post('/', authenticateToken, createCollection);
router.delete('/:id', authenticateToken, deleteCollection);

module.exports = router;