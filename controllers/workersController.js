const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// ✅ Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

exports.upload = upload; // Export multer middleware

// ✅ Worker Dashboard (list all materials)
exports.getDashboard = async (req, res) => {
    try {
        const [materials] = await db.query(`
            SELECT m.*, c.title AS course_title 
            FROM materials m
            JOIN courseslist c ON m.course_id = c.id
            ORDER BY m.created_at DESC
        `);

        const [courses] = await db.query(`SELECT * FROM courseslist`);

        res.render('admin/workers', {
            materials: materials || [],
            courses: courses || [],
            error: null
        });
    } catch (err) {
        console.error('Error loading worker dashboard:', err);
        res.render('admin/workers', {
            materials: [],
            courses: [],
            error: 'Failed to load materials'
        });
    }
};

// ✅ Upload Material
exports.uploadMaterial = async (req, res) => {
    const { name, course_id } = req.body;
    const file = req.file;

    if (!file) {
        return res.redirect('/admin/workers?error=File upload failed');
    }

    try {
        await db.query(
            'INSERT INTO materials (name, course_id, file) VALUES (?, ?, ?)',
            [name, course_id, file.filename]
        );
        res.redirect('/admin/workers');
    } catch (err) {
        console.error('Error uploading material:', err);
        res.redirect('/admin/workers?error=Failed to upload material');
    }
};

// ✅ Edit Material
exports.editMaterial = async (req, res) => {
    const { id } = req.params;
    const { name, course_id } = req.body;
    const file = req.file;

    try {
        if (file) {
            // Update with new file
            await db.query(
                'UPDATE materials SET name=?, course_id=?, file=? WHERE id=?',
                [name, course_id, file.filename, id]
            );
        } else {
            // Update without changing file
            await db.query(
                'UPDATE materials SET name=?, course_id=? WHERE id=?',
                [name, course_id, id]
            );
        }
        res.redirect('/admin/workers');
    } catch (err) {
        console.error('Error editing material:', err);
        res.redirect('/admin/workers?error=Failed to edit material');
    }
};

// ✅ Delete Material
exports.deleteMaterial = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('DELETE FROM materials WHERE id=?', [id]);
        res.redirect('/admin/workers');
    } catch (err) {
        console.error('Error deleting material:', err);
        res.redirect('/admin/workers?error=Failed to delete material');
    }
};
