const express = require('express');
const router = express.Router();
const multer = require('multer');
const portfolioController = require('../controllers/portfolioController');

// ✅ Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

/* 🌟 PUBLIC ROUTE: Display all portfolios on main site */
router.get('/', portfolioController.getPortfolios);

/* 🌟 ADMIN ROUTES */

// ✅ Show all portfolios (admin panel)
router.get('/admin/portfolios', portfolioController.showAdminPortfolios);

// ✅ Show Add Portfolio Form
router.get('/admin/add-portfolio', portfolioController.showAddForm);

// ✅ Handle Add Portfolio POST
router.post('/admin/add-portfolio', upload.single('image'), portfolioController.addPortfolio);

// ✅ Show Edit Portfolio Form
router.get('/admin/edit-portfolio/:id', portfolioController.showEditForm);

// ✅ Handle Edit Portfolio POST
router.post('/admin/edit-portfolio/:id', upload.single('image'), portfolioController.editPortfolio);

// ✅ Handle Delete Portfolio
router.post('/admin/delete-portfolio/:id', portfolioController.deletePortfolio);

module.exports = router;
