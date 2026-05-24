const pool = require('../config/db');

async function getHistory(req, res) {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'SELECT * FROM history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json({ history: result.rows });
  } catch (err) {
    console.error('Get history error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function saveHistory(req, res) {
  const userId = req.user.userId;
  const { method, url, headers, body, status_code, response_time, response_body, response_headers } = req.body;

  if (!method || !url) {
    return res.status(400).json({ error: 'method and url are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO history (user_id, method, url, headers, body, status_code, response_time, response_body, response_headers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        userId,
        method,
        url,
        JSON.stringify(headers || {}),
        body || '',
        status_code,
        response_time,
        response_body,
        JSON.stringify(response_headers || {})
      ]
    );
    res.status(201).json({ history: result.rows[0] });
  } catch (err) {
    console.error('Save history error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function clearHistory(req, res) {
  const userId = req.user.userId;

  try {
    await pool.query('DELETE FROM history WHERE user_id = $1', [userId]);
    res.json({ message: 'History cleared' });
  } catch (err) {
    console.error('Clear history error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getHistory, saveHistory, clearHistory };