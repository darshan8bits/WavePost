const pool = require('../config/db');

async function getRequests(req, res) {
  const { collection_id } = req.params;
  const userId = req.user.userId;

  try {
    const collectionCheck = await pool.query(
      'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
      [collection_id, userId]
    );

    if (collectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await pool.query(
      'SELECT * FROM requests WHERE collection_id = $1 ORDER BY created_at ASC',
      [collection_id]
    );

    res.json({ requests: result.rows });
  } catch (err) {
    console.error('Get requests error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function saveRequest(req, res) {
  const userId = req.user.userId;
  const { collection_id, name, method, url, headers, body, params, auth } = req.body;

  if (!collection_id || !name || !url) {
    return res.status(400).json({ error: 'collection_id, name and url are required' });
  }

  try {
    const collectionCheck = await pool.query(
      'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
      [collection_id, userId]
    );

    if (collectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await pool.query(
      `INSERT INTO requests (collection_id, name, method, url, headers, body, params, auth)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        collection_id,
        name,
        method || 'GET',
        url,
        JSON.stringify(headers || {}),
        body || '',
        JSON.stringify(params || {}),
        JSON.stringify(auth || {})
      ]
    );

    res.status(201).json({ request: result.rows[0] });
  } catch (err) {
    console.error('Save request error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateRequest(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;
  const { name, method, url, headers, body, params, auth } = req.body;

  try {
    const existing = await pool.query(
      `SELECT r.* FROM requests r
       JOIN collections c ON r.collection_id = c.id
       WHERE r.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const result = await pool.query(
      `UPDATE requests
       SET name = COALESCE($1, name),
           method = COALESCE($2, method),
           url = COALESCE($3, url),
           headers = COALESCE($4, headers),
           body = COALESCE($5, body),
           params = COALESCE($6, params),
           auth = COALESCE($7, auth)
       WHERE id = $8 RETURNING *`,
      [
        name,
        method,
        url,
        headers ? JSON.stringify(headers) : null,
        body,
        params ? JSON.stringify(params) : null,
        auth ? JSON.stringify(auth) : null,
        id
      ]
    );

    res.json({ request: result.rows[0] });
  } catch (err) {
    console.error('Update request error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteRequest(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM requests r USING collections c
       WHERE r.collection_id = c.id AND r.id = $1 AND c.user_id = $2
       RETURNING r.id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Request deleted' });
  } catch (err) {
    console.error('Delete request error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getRequests, saveRequest, updateRequest, deleteRequest };