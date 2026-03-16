const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

router.get('/', async (req, res) => {
  try {
    const { position, limit = 10 } = req.query;
    const now = new Date().toISOString();

    let query = supabase.from('advertisements').select('*').eq('is_active', true).lte('start_date', now).gte('end_date', now).limit(parseInt(limit));
    if (position) query = query.eq('position', position);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ads: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/click/:id', async (req, res) => {
  try {
    const { data } = await supabase.from('advertisements').select('clicks').eq('id', req.params.id).single();
    await supabase.from('advertisements').update({ clicks: (data?.clicks || 0) + 1 }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
