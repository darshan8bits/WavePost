const express = require('express');
const router = express.Router();
const { getRequests, saveRequest, updateRequest, deleteRequest } = require('../controllers/requestsController');
const { authenticateToken } = require('../middleware/auth');

router.get('/:collection_id', authenticateToken, getRequests);
router.post('/', authenticateToken, saveRequest);
router.put('/:id', authenticateToken, updateRequest);
router.delete('/:id', authenticateToken, deleteRequest);

module.exports = router;