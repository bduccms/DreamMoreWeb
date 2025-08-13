const db = require('../config/db'); // make sure db is mysql2/promise
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Configure multer for course photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/Uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG/PNG images are allowed for course photos'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// 🔒 Middleware to check if user is admin
function isAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/?error=Unauthorized');
    }
    next();
}

// ✅ Get Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const [users] = await db.query('SELECT COUNT(*) as total_users FROM users');
        const [students] = await db.query('SELECT COUNT(*) as total_students FROM users WHERE role = "student"');
        const [workers] = await db.query('SELECT COUNT(*) as total_workers FROM users WHERE role = "worker"');
        const [courses] = await db.query('SELECT COUNT(*) as total_courses FROM courseslist');
        const [orders] = await db.query(`
            SELECT o.id, o.service_detail, o.created_at, 
                   u.first_name, u.last_name, u.email, u.phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);

        res.render('admin/dashboard', {
            user: req.session.user,
            total_users: users[0].total_users,
            total_students: students[0].total_students,
            total_workers: workers[0].total_workers,
            total_courses: courses[0].total_courses,
            orders,
            error: null
        });
    } catch (err) {
        console.error('❌ Error loading dashboard:', err.message);
        res.render('admin/dashboard', {
            user: req.session.user,
            total_users: 0,
            total_students: 0,
            total_workers: 0,
            total_courses: 0,
            orders: [],
            error: 'Error loading dashboard. Please try again.'
        });
    }
};

// ✅ Get Users
exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, first_name, last_name, email, phone, role FROM users');
        res.render('admin/users', { user: req.session.user, users, error: null });
    } catch (err) {
        console.error('❌ Error fetching users:', err.message);
        res.render('admin/users', { user: req.session.user, users: [], error: 'Error loading users. Please try again.' });
    }
};

// ✅ Add User
exports.addUser = async (req, res) => {
    const { first_name, last_name, phone, email, password, role } = req.body;
    if (!['admin', 'worker', 'student'].includes(role)) {
        return res.redirect('/admin/users?error=Invalid role');
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (first_name, last_name, phone, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [first_name, last_name, phone, email, hashedPassword, role]
        );
        res.redirect('/admin/users?message=User added successfully');
    } catch (err) {
        console.error('❌ Error adding user:', err.message);
        res.redirect('/admin/users?error=Failed to add user');
    }
};

// ✅ Get Payments
exports.getPayments = async (req, res) => {
    try {
        const [payments] = await db.query(`
            SELECT p.id, p.user_id, u.first_name, u.last_name, p.course_id, 
                   c.title as course_title, p.payment_method, p.payment_screenshot, p.payment_status
            FROM payments p
            JOIN users u ON p.user_id = u.id
            JOIN courseslist c ON p.course_id = c.id
        `);
        res.render('admin/payments', { user: req.session.user, payments, error: null });
    } catch (err) {
        console.error('❌ Error fetching payments:', err.message);
        res.render('admin/payments', { user: req.session.user, payments: [], error: 'Error loading payments. Please try again.' });
    }
};

// ✅ Verify Payment
exports.verifyPayment = async (req, res) => {
    const { payment_id, course_id, user_id } = req.body;
    try {
        await db.query('UPDATE payments SET payment_status = "verified" WHERE id = ?', [payment_id]);
        await db.query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [user_id, course_id]);
        res.redirect('/admin/payments?message=Payment verified and user enrolled');
    } catch (err) {
        console.error('❌ Error verifying payment:', err.message);
        res.redirect('/admin/payments?error=Verification failed');
    }
};

// ✅ Get Courses
exports.getCourses = async (req, res) => {
    try {
        const [courses] = await db.query('SELECT * FROM courseslist ORDER BY id DESC');
        // Ensure price is a number
        const formattedCourses = courses.map(course => ({
            ...course,
            price: parseFloat(course.price) || 0
        }));
        // Fetch applicants for each course
        for (let course of formattedCourses) {
            const [applicants] = await db.query(`
                SELECT ca.id, ca.user_id, ca.course_key, ca.screenshot, ca.status, 
                       u.first_name, u.last_name, u.email
                FROM course_applications ca
                JOIN users u ON ca.user_id = u.id
                WHERE ca.course_key = ?
            `, [course.title]);
            course.applicants = applicants || [];
        }
        console.log('✅ Fetched courses:', formattedCourses.length);
        res.render('admin/courses', {
            user: req.session.user,
            courses: formattedCourses,
            error: null
        });
    } catch (err) {
        console.error('❌ Error fetching courses:', err.message);
        res.render('admin/courses', {
            user: req.session.user,
            courses: [],
            error: 'Error loading courses. Please try again.'
        });
    }
};

// ✅ Add Course
exports.addCourse = [
    upload.single('photo'),
    async (req, res) => {
        const { title, description, price } = req.body;
        const photo = req.file ? req.file.filename : null;
        if (!title || !price) {
            return res.redirect('/admin/courses?error=Title and price are required');
        }
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice)) {
            return res.redirect('/admin/courses?error=Price must be a valid number');
        }
        try {
            await db.query(
                'INSERT INTO courseslist (title, description, photo, price) VALUES (?, ?, ?, ?)',
                [title, description || '', photo, parsedPrice]
            );
            res.redirect('/admin/courses?message=Course added successfully');
        } catch (err) {
            console.error('❌ Error adding course:', err.message);
            res.redirect('/admin/courses?error=Failed to add course');
        }
    }
];

// ✅ Edit Course
exports.editCourse = [
    upload.single('photo'),
    async (req, res) => {
        const { id, title, description, price } = req.body;
        const photo = req.file ? req.file.filename : null;
        if (!id || !title || !price) {
            return res.redirect('/admin/courses?error=Course ID, title, and price are required');
        }
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice)) {
            return res.redirect('/admin/courses?error=Price must be a valid number');
        }
        try {
            const updates = { title, description: description || '', price: parsedPrice };
            if (photo) updates.photo = photo;
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            values.push(id);
            const [result] = await db.query(`UPDATE courseslist SET ${fields} WHERE id = ?`, values);
            if (result.affectedRows === 0) {
                return res.redirect('/admin/courses?error=Course not found');
            }
            console.log('✅ Course updated. ID:', id);
            res.redirect('/admin/courses?message=Course updated successfully');
        } catch (err) {
            console.error('❌ Error updating course:', err.message);
            res.redirect('/admin/courses?error=Failed to update course');
        }
    }
];

// ✅ Delete Course
exports.deleteCourse = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.redirect('/admin/courses?error=Course ID is required');
    }
    try {
        const [result] = await db.query('DELETE FROM courseslist WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.redirect('/admin/courses?error=Course not found');
        }
        console.log('✅ Course deleted. ID:', id);
        res.redirect('/admin/courses?message=Course deleted successfully');
    } catch (err) {
        console.error('❌ Error deleting course:', err.message);
        res.redirect('/admin/courses?error=Failed to delete course');
    }
};

// ✅ Approve Application
exports.approveApplication = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.redirect('/admin/courses?error=Application ID is required');
    }
    try {
        const [result] = await db.query('UPDATE course_applications SET status = ? WHERE id = ?', ['approved', id]);
        if (result.affectedRows === 0) {
            return res.redirect('/admin/courses?error=Application not found');
        }
        console.log('✅ Application approved. ID:', id);
        res.redirect('/admin/courses?message=Application approved successfully');
    } catch (err) {
        console.error('❌ Error approving application:', err.message);
        res.redirect('/admin/courses?error=Failed to approve application');
    }
};

// ✅ Reject Application
exports.rejectApplication = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.redirect('/admin/courses?error=Application ID is required');
    }
    try {
        const [result] = await db.query('UPDATE course_applications SET status = ? WHERE id = ?', ['rejected', id]);
        if (result.affectedRows === 0) {
            return res.redirect('/admin/courses?error=Application not found');
        }
        console.log('✅ Application rejected. ID:', id);
        res.redirect('/admin/courses?message=Application rejected successfully');
    } catch (err) {
        console.error('❌ Error rejecting application:', err.message);
        res.redirect('/admin/courses?error=Failed to reject application');
    }
};

module.exports = exports;