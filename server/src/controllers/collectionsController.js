const pool = require('../config/db');

async function getCollections(req, res) {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ collections: result.rows });
  } catch (err) {
    console.error('Get collections error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createCollection(req, res) {
  const userId = req.user.userId;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Collection name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO collections (user_id, name) VALUES ($1, $2) RETURNING *',
      [userId, name]
    );
    res.status(201).json({ collection: result.rows[0] });
  } catch (err) {
    console.error('Create collection error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteCollection(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json({ message: 'Collection deleted' });
  } catch (err) {
    console.error('Delete collection error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getCollections, createCollection, deleteCollection };