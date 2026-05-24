const express = require('express');
const router = express.Router();
const { getHistory, saveHistory, clearHistory } = require('../controllers/historyController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getHistory);
router.post('/', authenticateToken, saveHistory);
router.delete('/', authenticateToken, clearHistory);

module.exports = router;