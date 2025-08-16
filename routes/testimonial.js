const express = require('express');
const router = express.Router();
const db = require('../config/db'); // your database connection
const multer = require('multer');
const path = require('path');

// Multer config for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/Uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// GET all testimonials for admin
router.get('/admin/testimonials', async (req, res) => {
  try {
    const [testimonials] = await db.query('SELECT * FROM testimonials');
    res.render('admin/testimonials', { testimonials });
  } catch (err) {
    console.error(err);
    res.render('admin/testimonials', { testimonials: [] });
  }
});

// GET add testimonial form
router.get('/admin/add-testimonial', (req, res) => {
  res.render('admin/add-testimonial');
});

// POST add testimonial
router.post('/admin/add-testimonial', upload.single('photo'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const photo = req.file ? '/Uploads/' + req.file.filename : null;
    await db.query('INSERT INTO testimonials (name, description, photo) VALUES (?, ?, ?)', [name, description, photo]);
    res.redirect('/admin/testimonials'); // redirect to testimonial list
  } catch (err) {
    console.error(err);
    res.redirect('/admin/add-testimonial');
  }
});

// GET edit testimonial form
router.get('/admin/edit-testimonial/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM testimonials WHERE id = ?', [id]);
    if (rows.length === 0) return res.redirect('/admin/testimonials');
    res.render('admin/edit-testimonial', { testimonial: rows[0] });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/testimonials');
  }
});

// POST update testimonial
router.post('/admin/edit-testimonial/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    let query = 'UPDATE testimonials SET name = ?, description = ?';
    const params = [name, description];

    if (req.file) {
      query += ', photo = ?';
      params.push('/Uploads/' + req.file.filename);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);
    res.redirect('/admin/testimonials'); // redirect to testimonial list
  } catch (err) {
    console.error(err);
    res.redirect('/admin/testimonials');
  }
});

// GET delete testimonial
router.get('/admin/delete-testimonial/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM testimonials WHERE id = ?', [id]);
    res.redirect('/admin/testimonials'); // redirect after delete
  } catch (err) {
    console.error(err);
    res.redirect('/admin/testimonials');
  }
});

module.exports = router;
