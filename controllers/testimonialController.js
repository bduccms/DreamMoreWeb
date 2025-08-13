const db = require('../config/db');

// Fetch testimonials, courses, and portfolios for home page
exports.getTestimonials = async (req, res) => {
  try {
    const [testimonials] = await db.query("SELECT * FROM testimonials ORDER BY id DESC");
    const [courses] = await db.query("SELECT * FROM courseslist ORDER BY id DESC");
    const [portfolios] = await db.query("SELECT * FROM portfolios ORDER BY created_at DESC");

    res.render("home", {
      testimonials: testimonials || [],
      courses: courses || [],
      portfolios: portfolios || [],
      user: req.session.user || null,
      error: null
    });
  } catch (err) {
    console.error('❌ Error fetching home page data:', err);
    res.render("home", {
      testimonials: [],
      courses: [],
      portfolios: [],
      user: req.session.user || null,
      error: "Failed to load home page data"
    });
  }
};

// Show Add/Edit Testimonial Form
exports.showForm = async (req, res) => {
  const { id } = req.params;

  if (id) {
    // Editing: Fetch existing testimonial
    try {
      const [rows] = await db.query("SELECT * FROM testimonials WHERE id = ?", [id]);
      const testimonial = rows[0];
      if (!testimonial) return res.status(404).send("Testimonial not found");
      return res.render('admin/testimonial-form', { testimonial, user: req.session.user });
    } catch (err) {
      console.error("❌ Error fetching testimonial for edit:", err);
      return res.status(500).send("Server Error");
    }
  } else {
    // Adding: Render empty form
    res.render('admin/testimonial-form', { testimonial: null, user: req.session.user });
  }
};

// Handle Add Testimonial POST
exports.addTestimonial = async (req, res) => {
  const { name, description } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await db.query(
      "INSERT INTO testimonials (name, description, photo) VALUES (?, ?, ?)",
      [name, description, photo]
    );
    console.log("✅ Testimonial added successfully");
    res.redirect('/testimonials');
  } catch (err) {
    console.error("❌ Error adding testimonial:", err);
    res.status(500).send("Server Error");
  }
};

// Handle Edit Testimonial POST
exports.editTestimonial = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  let photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    if (!photo) {
      // Keep existing photo if no new one uploaded
      const [rows] = await db.query("SELECT photo FROM testimonials WHERE id = ?", [id]);
      if (rows[0]) photo = rows[0].photo;
    }

    await db.query(
      "UPDATE testimonials SET name = ?, description = ?, photo = ? WHERE id = ?",
      [name, description, photo, id]
    );

    console.log(`✅ Testimonial with ID ${id} updated`);
    res.redirect('/testimonials');
  } catch (err) {
    console.error("❌ Error updating testimonial:", err);
    res.status(500).send("Server Error");
  }
};

// Handle Delete Testimonial
exports.deleteTestimonial = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM testimonials WHERE id = ?", [id]);
    console.log(`✅ Testimonial with ID ${id} deleted`);
    res.redirect('/testimonials');
  } catch (err) {
    console.error("❌ Error deleting testimonial:", err);
    res.status(500).send("Server Error");
  }
};

// Show Admin Testimonials List
exports.showAdminTestimonials = async (req, res) => {
  try {
    const [testimonials] = await db.query("SELECT * FROM testimonials ORDER BY id DESC");
    res.render("admin/testimonials", {
      testimonials,
      user: req.session.user
    });
  } catch (err) {
    console.error("❌ Error fetching testimonials:", err);
    res.status(500).send("Server Error");
  }
};

