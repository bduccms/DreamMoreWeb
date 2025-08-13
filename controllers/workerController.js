const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Move top-level await inside a function
async function checkDatabase() {
    try {
        const [dbName] = await db.query("SELECT DATABASE() AS db");
        console.log("✅ Connected to database:", dbName[0].db);
    } catch (err) {
        console.error("❌ Database connection error:", err);
    }
}
checkDatabase();

// ✅ Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// ✅ Worker Dashboard (list all materials)
exports.getDashboard = async (req, res) => {
    try {
        const [materials] = await db.query(`
            SELECT m.*, c.title AS course_title 
            FROM course_materials m
            JOIN courseslist c ON m.course_id = c.id
            ORDER BY m.created_at DESC
        `);

        const [courses] = await db.query(`SELECT * FROM courseslist`);

        res.render('admin/workers', {
            materials: materials || [],
            courses: courses || [],
            error: null,
            success: null,
            old: {} // ✅ Always send old to avoid ReferenceError
        });
    } catch (err) {
        console.error('Error loading worker dashboard:', err);
        res.render('admin/workers', {
            materials: [],
            courses: [],
            error: '❌ Failed to load materials',
            success: null,
            old: {} // ✅ Pass empty object
        });
    }
};



// ✅ Upload Material
// ✅ Upload Material Controller
exports.uploadMaterial = async (req, res) => {
    try {
        const { title, description, course_id } = req.body;
        const file = req.file;

        // ✅ Fetch materials & courses for re-rendering if needed
        const [materials] = await db.query(`
            SELECT m.*, c.title AS course_title 
            FROM course_materials m
            JOIN courses c ON m.course_id = c.id
            ORDER BY m.created_at DESC
        `);
        const [courses] = await db.query(`SELECT * FROM courses`);

        // ✅ Validate required fields
        if (!title || !description || !course_id || !file) {
            return res.render('admin/workers', {
                materials,
                courses,
                error: '⚠️ All fields are required (including the file).',
                success: null,
                old: { title, description, course_id }
            });
        }

        // ✅ Check if the selected course exists
        const [existingCourse] = await db.query(
            'SELECT id FROM courses WHERE id = ?',
            [course_id]
        );
        if (existingCourse.length === 0) {
            return res.render('admin/workers', {
                materials,
                courses,
                error: '⚠️ Invalid course selected. Please try again.',
                success: null,
                old: { title, description, course_id }
            });
        }

        // ✅ Insert material into DB
        await db.query(
            `INSERT INTO course_materials (title, description, course_id, file_path) VALUES (?, ?, ?, ?)`,
            [title, description, course_id, file.filename]
        );

        // ✅ Fetch updated materials list
        const [updatedMaterials] = await db.query(`
            SELECT m.*, c.title AS course_title 
            FROM course_materials m
            JOIN courses c ON m.course_id = c.id
            ORDER BY m.created_at DESC
        `);

        return res.render('admin/workers', {
            materials: updatedMaterials,
            courses,
            error: null,
            success: '✅ Material uploaded successfully!',
            old: {}
        });

    } catch (err) {
        console.error('❌ Error uploading material:', err);
        return res.render('admin/workers', {
            materials: [],
            courses: [],
            error: '❌ Failed to upload material. Please try again later.',
            success: null,
            old: {}
        });
    }
};




// ✅ Edit Material
exports.editMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, course_id } = req.body;
        let file = req.file ? req.file.filename : null;

        if (!name || !course_id) {
            return res.redirect('/admin/workers?error=Name and Course are required');
        }

        // If file uploaded, update file too
        if (file) {
            const [oldMaterial] = await db.query(`SELECT file FROM materials WHERE id = ?`, [id]);
            if (oldMaterial.length && oldMaterial[0].file) {
                const oldFilePath = path.join(__dirname, '..', 'public', 'uploads', oldMaterial[0].file);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }
            await db.query(
                `UPDATE materials SET name=?, file=?, course_id=? WHERE id=?`,
                [name, file, course_id, id]
            );
        } else {
            await db.query(
                `UPDATE materials SET name=?, course_id=? WHERE id=?`,
                [name, course_id, id]
            );
        }

        res.redirect('/admin/workers?success=Material updated successfully');
    } catch (err) {
        console.error('❌ Error editing material:', err);
        res.redirect('/admin/workers?error=Failed to edit material');
    }
};

// ✅ Delete Material
exports.deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete file from uploads folder
        const [material] = await db.query(`SELECT file FROM materials WHERE id = ?`, [id]);
        if (material.length && material[0].file) {
            const filePath = path.join(__dirname, '..', 'public', 'uploads', material[0].file);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        // Delete from database
        await db.query(`DELETE FROM materials WHERE id = ?`, [id]);

        res.redirect('/admin/workers?success=Material deleted successfully');
    } catch (err) {
        console.error('❌ Error deleting material:', err);
        res.redirect('/admin/workers?error=Failed to delete material');
    }
};

exports.upload = upload; // export multer config
