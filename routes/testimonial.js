const express = require('express');
const router = express.Router();
const multer = require('multer');
const testimonialController = require('../controllers/testimonialController');

// Configure multer for photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Route: Home page (list testimonials)
router.get('/', testimonialController.getTestimonials);

// Route: Show form to add testimonial
router.get('/admin/add-testimonial', testimonialController.showForm);

// Route: Handle add testimonial POST
router.post('/admin/add-testimonial', upload.single('photo'), testimonialController.addTestimonial);

// Route: Show form to edit testimonial
router.get('/admin/edit-testimonial/:id', testimonialController.showForm);

// Route: Handle edit testimonial POST
router.post('/admin/edit-testimonial/:id', upload.single('photo'), testimonialController.editTestimonial);

// Route: Handle delete testimonial
router.get('/admin/delete-testimonial/:id', testimonialController.deleteTestimonial);
router.get('/admin/testimonials', testimonialController.showAdminTestimonials);

module.exports = router;
