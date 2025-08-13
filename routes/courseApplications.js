const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Render the EJS template with data
router.get('/', async (req, res) => {
  try {
    const [applications] = await db.query('SELECT * FROM course_applications');
    res.render('course-applications', { 
      applications: applications,
      getStatusBadgeClass: function(status) {
        if (!status) return 'bg-secondary';
        switch (status.toLowerCase()) {
          case 'approved': return 'bg-success';
          case 'pending': return 'bg-warning text-dark';
          case 'rejected': return 'bg-danger';
          default: return 'bg-secondary';
        }
      },
      formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    });
  } catch (err) {
    console.error('Error fetching course applications:', err);
    res.status(500).render('error', { message: 'Failed to load course applications' });
  }
});

// API endpoint for single application (used by the view button)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM course_applications WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching course application:', err);
    res.status(500).json({ error: 'Failed to fetch course application' });
  }
});

module.exports = router;