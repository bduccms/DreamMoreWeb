const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);





router.post('/register', authController.register);
router.post('/login', authController.login);  // <-- Add this login route

module.exports = router;

router.post('/logout', authController.logout);

