const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// -------------------- Public --------------------
exports.getTestimonials = async (req, res) => {
  try {
    const [testimonials] = await db.query("SELECT * FROM testimonials ORDER BY id DESC");
    
    // Add photo path for public use
    const formattedTestimonials = testimonials.map(testimonial => ({
      ...testimonial,
      photo: testimonial.photo ? testimonial.photo : null
    }));

    res.render('testimonials', { testimonials: formattedTestimonials });
  } catch (err) {
    console.error('Error fetching testimonials:', err);
    res.render('testimonials', { testimonials: [] });
  }
};

// -------------------- Admin --------------------

// Show add/edit form
exports.showForm = async (req, res) => {
  const id = req.params.id;
  if (id) {
    // Editing
    try {
      const [rows] = await db.query("SELECT * FROM testimonials WHERE id = ?", [id]);
      if (rows.length === 0) {
        return res.redirect('/admin/testimonials');
      }
      res.render('add-testimonials', { testimonial: rows[0] });
    } catch (err) {
      console.error(err);
      res.redirect('/admin/testimonials');
    }
  } else {
    // Adding
    res.render('add-testimonials', { testimonial: null });
  }
};

// Handle add testimonial
exports.addTestimonial = async (req, res) => {
  try {
    const { name, description } = req.body;
    const photo = req.file ? req.file.filename : null;

    await db.query(
      "INSERT INTO testimonials (name, description, photo) VALUES (?, ?, ?)",
      [name, description, photo]
    );

    res.redirect('/admin/testimonials');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/testimonials');
  }
};

// Handle edit testimonial
exports.editTestimonial = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description } = req.body;

    // Get existing photo if not replaced
    let photo = req.file ? req.file.filename : null;
    if (!photo) {
      const [rows] = await db.query("SELECT photo FROM testimonials WHERE id = ?", [id]);
      photo = rows.length > 0 ? rows[0].photo : null;
    }

    await db.query(
      "UPDATE testimonials SET name = ?, description = ?, photo = ? WHERE id = ?",
      [name, description, photo, id]
    );

    res.redirect('/admin/testimonials');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/testimonials');
  }
};

// Delete testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const id = req.params.id;

    // Delete photo from server
    const [rows] = await db.query("SELECT photo FROM testimonials WHERE id = ?", [id]);
    if (rows.length > 0 && rows[0].photo) {
      const photoPath = path.join(__dirname, '../public/uploads', rows[0].photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await db.query("DELETE FROM testimonials WHERE id = ?", [id]);
    res.redirect('/admin/testimonials');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/testimonials');
  }
};

// Show all testimonials in admin panel
exports.showAdminTestimonials = async (req, res) => {
  try {
    const [testimonials] = await db.query("SELECT * FROM testimonials ORDER BY id DESC");
    res.render('admin-testimonials', { testimonials });
  } catch (err) {
    console.error(err);
    res.render('admin-testimonials', { testimonials: [] });
  }
};
