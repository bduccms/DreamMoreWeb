const path = require('path');
const db = require('../config/db');

// ✅ Display all portfolios on homepage
exports.getPortfolios = async (req, res) => {
  try {
    const [portfolios] = await db.query("SELECT * FROM portfolios ORDER BY created_at DESC");
    const [courses] = await db.query("SELECT * FROM courseslist");

    // Ensure image paths have correct prefix for production
    const updatedPortfolios = portfolios.map(p => {
      if (p.image && !p.image.startsWith('/uploads/')) {
        p.image = `/uploads/${p.image}`;
      }
      return p;
    });

    res.render("home", { 
      portfolios: updatedPortfolios || [], 
      courses: courses || [], 
      testimonials: [], 
      user: req.session.user || null 
    });
  } catch (err) {
    console.error('❌ Error fetching portfolios:', err);
    res.render("home", { portfolios: [], courses: [], testimonials: [], user: null });
  }
};

// ✅ Show all portfolios in admin panel
exports.showAdminPortfolios = async (req, res) => {
  try {
    const [portfolios] = await db.query("SELECT * FROM portfolios ORDER BY created_at DESC");
    res.render('admin/portfolio', { portfolios });
  } catch (err) {
    console.error('❌ Error loading admin portfolios:', err);
    res.status(500).send("Server Error");
  }
};

// ✅ Show Add Portfolio Form
exports.showAddForm = (req, res) => {
  res.render('admin/portfolio-form', {
    formTitle: 'Add New Portfolio',
    formAction: '/admin/add-portfolio',
    portfolio: null
  });
};

// ✅ Handle Add Portfolio POST
exports.addPortfolio = async (req, res) => {
  const { title, description, category, drive_url, github_url } = req.body;

  // Always store image path relative to /uploads
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await db.query(
      "INSERT INTO portfolios (title, description, image, drive_url, github_url, category) VALUES (?, ?, ?, ?, ?, ?)",
      [title, description, image, drive_url, github_url, category]
    );
    console.log("✅ Portfolio added successfully");
    res.redirect('/admin/portfolios');
  } catch (err) {
    console.error("❌ Error adding portfolio:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ Show Edit Portfolio Form
exports.showEditForm = async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await db.query("SELECT * FROM portfolios WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).send("Portfolio not found");
    }
    res.render('admin/portfolio-form', {
      formTitle: 'Edit Portfolio',
      formAction: `/admin/edit-portfolio/${id}`,
      portfolio: rows[0]
    });
  } catch (err) {
    console.error("❌ Error loading edit form:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ Handle Edit Portfolio POST
exports.editPortfolio = async (req, res) => {
  const id = req.params.id;
  const { title, description, category, drive_url, github_url, currentImage } = req.body;

  // Use uploaded file if provided, otherwise keep current image
  const image = req.file ? `/uploads/${req.file.filename}` : currentImage;

  try {
    await db.query(
      "UPDATE portfolios SET title=?, description=?, image=?, drive_url=?, github_url=?, category=? WHERE id=?",
      [title, description, image, drive_url, github_url, category, id]
    );
    console.log("✅ Portfolio updated successfully");
    res.redirect('/admin/portfolios');
  } catch (err) {
    console.error("❌ Error updating portfolio:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ Handle Delete Portfolio
exports.deletePortfolio = async (req, res) => {
  const id = req.params.id;
  try {
    await db.query("DELETE FROM portfolios WHERE id = ?", [id]);
    console.log("✅ Portfolio deleted successfully");
    res.redirect('/admin/portfolios');
  } catch (err) {
    console.error("❌ Error deleting portfolio:", err);
    res.status(500).send("Server Error");
  }
};
