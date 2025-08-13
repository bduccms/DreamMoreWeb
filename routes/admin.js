const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAdmin = require('../middleware/isAdmin');

// Admin routes (all protected by isAdmin middleware)
router.get('/dashboard', isAdmin, adminController.getDashboard);
router.get('/users', isAdmin, adminController.getUsers);
router.post('/users', isAdmin, adminController.addUser);
router.get('/payments', isAdmin, adminController.getPayments);
router.post('/verify-payment', isAdmin, adminController.verifyPayment);
router.get('/courses', isAdmin, adminController.getCourses);
router.post('/courses', isAdmin, adminController.addCourse);
router.post('/courses/edit', isAdmin, adminController.editCourse);
router.post('/courses/delete/:id', isAdmin, adminController.deleteCourse);
router.post('/courses/approve/:id', isAdmin, adminController.approveApplication);
router.post('/courses/reject/:id', isAdmin, adminController.rejectApplication);

module.exports = router;