const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');

// Worker Dashboard
router.get('/', workerController.getDashboard);

// Upload Material
router.post(
    '/materials/upload',
    workerController.upload.single('file'),
    workerController.uploadMaterial
);

// Edit Material
router.post(
    '/materials/edit/:id',
    workerController.upload.single('file'),
    workerController.editMaterial
);

// Delete Material
router.get('/materials/delete/:id', workerController.deleteMaterial);

module.exports = router;
