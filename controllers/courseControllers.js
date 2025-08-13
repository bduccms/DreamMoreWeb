const pool = require('../config/db');
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + file.originalname;
        cb(null, uniqueSuffix);
    }
});
const upload = multer({ storage });

// Get all courses for front page


// ... (storage and upload setup remains the same)

// Get all courses for front page
exports.getCourses = async (req, res) => {
    try {
        const [courses] = await pool.query('SELECT * FROM courseslist ORDER BY id DESC');
        const formattedCourses = courses.map(course => ({
            ...course,
            price: parseFloat(course.price) || 0,
            // Normalize title for matching
            normalizedTitle: course.title.trim().toLowerCase()
        }));
        
        let applications = [];
        let enrolledCourses = [];
        
        if (req.session.user) {
            // Improved application query with normalized titles
            [applications] = await pool.query(`
                SELECT ca.course_key, ca.status, c.title, c.description, c.photo, c.price
                FROM course_applications ca
                LEFT JOIN courseslist c ON ca.course_key = c.title
                WHERE ca.user_id = ?
            `, [req.session.user.id]);
            
            // Normalize application keys for reliable matching
            applications = applications.map(app => ({
                ...app,
                normalizedKey: app.course_key ? app.course_key.trim().toLowerCase() : ''
            }));
            
            enrolledCourses = applications
                .filter(app => app.status === 'approved' && app.title)
                .map(app => app.title.trim());
                
            console.log('✅ Fetched applications:', applications.length);
        }

        res.render('courses', {
            user: req.session.user ? { 
                ...req.session.user, 
                enrolledCourses, 
                applications 
            } : null,
            courses: formattedCourses || [],
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error('❌ Error fetching courses:', err);
        res.status(500).render('courses', {
            user: req.session.user,
            courses: [],
            error: 'Failed to load courses. Please try again.',
            success: null
        });
    }
};

// ... (rest of the controller remains the same)
// Handle course application
exports.applyCourse = async (req, res) => {
    try {
        console.log('DEBUG req.body:', req.body);
        console.log('DEBUG req.file:', req.file);

        const { courseKey, userId } = req.body;
        const screenshot = req.file ? req.file.filename : null;

        // Check if user is logged in
        if (!req.session.user || req.session.user.id !== parseInt(userId)) {
            return res.status(401).json({ error: 'Please sign in to apply for a course.' });
        }

        // Validate user exists
        const [user] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (!user || user.length === 0) {
            console.error('Invalid user ID:', userId);
            return res.status(401).json({ error: 'Invalid user. Please sign in again.' });
        }

        // Validate input
        if (!courseKey || !userId || !screenshot) {
            console.error('Missing required fields:', { courseKey, userId, screenshot });
            return res.status(400).json({ error: 'Missing required data: courseKey, userId, or payment screenshot.' });
        }

        // Check if user already applied
        const [existing] = await pool.query(
            'SELECT id FROM course_applications WHERE user_id = ? AND course_key = ? AND status = ?',
            [userId, courseKey, 'pending']
        );
        if (existing && existing.length > 0) {
            console.error('User already applied for course:', courseKey);
            return res.status(400).json({ error: 'You have already applied for this course.' });
        }

        // Save application
        const sql = `
            INSERT INTO course_applications (user_id, course_key, screenshot, created_at, status)
            VALUES (?, ?, ?, NOW(), 'pending')
        `;
        const [result] = await pool.execute(sql, [userId, courseKey, screenshot]);
        console.log('✅ Application saved. Insert ID:', result.insertId);
        return res.status(200).json({ success: true, message: 'Application submitted successfully' });
    } catch (err) {
        console.error('❌ Error saving application:', err.message);
        return res.status(500).json({ error: 'Failed to save application. Please try again.' });
    }
};

// Show dashboard with all courses and their applicants
exports.getDashboard = async (req, res) => {
    try {
        const [courses] = await pool.query('SELECT * FROM courseslist ORDER BY id DESC');
        const formattedCourses = courses.map(course => ({
            ...course,
            price: parseFloat(course.price) || 0
        }));
        for (let course of formattedCourses) {
            const [applicants] = await pool.query(`
                SELECT ca.id, ca.user_id, ca.course_key, ca.screenshot, ca.status, 
                       u.first_name, u.last_name, u.email
                FROM course_applications ca
                JOIN users u ON ca.user_id = u.id
                WHERE ca.course_key = ?
            `, [course.title]);
            course.applicants = applicants || [];
        }
        console.log('✅ Fetched dashboard data:', formattedCourses.length, 'courses');
        res.render('admin/courses', {
            courses: formattedCourses || [],
            error: null
        });
    } catch (err) {
        console.error('❌ Error fetching dashboard data:', err.message);
        res.status(500).render('admin/courses', {
            courses: [],
            error: 'Failed to load courses or applicants. Please try again.'
        });
    }
};

// Add a new course
exports.addCourse = async (req, res) => {
    try {
        const { title, description, price } = req.body;
        const photo = req.file ? req.file.filename : null;

        if (!title || !price) {
            console.error('Missing required fields:', { title, price });
            return res.status(400).json({ error: 'Title and price are required' });
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice)) {
            console.error('Invalid price format:', price);
            return res.status(400).json({ error: 'Price must be a valid number' });
        }

        const [result] = await pool.query(
            'INSERT INTO courseslist (title, description, photo, price) VALUES (?, ?, ?, ?)',
            [title, description || '', photo, parsedPrice]
        );
        console.log('✅ New course added:', title, 'ID:', result.insertId);
        res.redirect('/courses/dashboard');
    } catch (err) {
        console.error('❌ Error adding course:', err.message);
        res.status(500).render('admin/courses', {
            courses: [],
            error: 'Failed to add course. Please try again.'
        });
    }
};

// Edit a course
exports.editCourse = async (req, res) => {
    try {
        const { id, title, description, price } = req.body;
        const photo = req.file ? req.file.filename : null;

        if (!id || !title || !price) {
            console.error('Missing required fields:', { id, title, price });
            return res.status(400).json({ error: 'Course ID, title, and price are required' });
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice)) {
            console.error('Invalid price format:', price);
            return res.status(400).json({ error: 'Price must be a valid number' });
        }

        const updates = { title, description: description || '', price: parsedPrice };
        if (photo) updates.photo = photo;

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);

        const [result] = await pool.query(`UPDATE courseslist SET ${fields} WHERE id = ?`, values);
        if (result.affectedRows === 0) {
            console.error('Course not found:', id);
            return res.status(404).json({ error: 'Course not found' });
        }

        console.log('✅ Course updated. ID:', id);
        res.redirect('/courses/dashboard');
    } catch (err) {
        console.error('❌ Error updating course:', err.message);
        res.status(500).render('admin/courses', {
            courses: [],
            error: 'Failed to update course. Please try again.'
        });
    }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            console.error('Missing course ID');
            return res.status(400).json({ error: 'Course ID is required' });
        }

        const [result] = await pool.query('DELETE FROM courseslist WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            console.error('Course not found:', id);
            return res.status(404).json({ error: 'Course not found' });
        }

        console.log('✅ Course deleted. ID:', id);
        res.redirect('/courses/dashboard');
    } catch (err) {
        console.error('❌ Error deleting course:', err.message);
        res.status(500).render('admin/courses', {
            courses: [],
            error: 'Failed to delete course. Please try again.'
        });
    }
};

// Remove a course (alias for delete)
exports.removeCourse = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            console.error('Missing course ID');
            return res.status(400).json({ error: 'Course ID is required' });
        }

        const [result] = await pool.query('DELETE FROM courseslist WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            console.error('Course not found:', id);
            return res.status(404).json({ error: 'Course not found' });
        }

        console.log('✅ Course removed. ID:', id);
        res.redirect('/courses/dashboard');
    } catch (err) {
        console.error('❌ Error removing course:', err.message);
        res.status(500).render('admin/courses', {
            courses: [],
            error: 'Failed to remove course. Please try again.'
        });
    }
};

// Approve an application
exports.approveApplication = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            console.error('Missing application ID');
            return res.status(400).json({ error: 'Application ID is required' });
        }

        const [result] = await pool.query(
            'UPDATE course_applications SET status = ? WHERE id = ?',
            ['approved', id]
        );

        if (result.affectedRows === 0) {
            console.error('Application not found:', id);
            return res.status(404).json({ error: 'Application not found' });
        }

        console.log('✅ Application approved. ID:', id);

        // ✅ Refresh user's applications in session
        if (req.session.user) {
            const [updatedApplications] = await pool.query(
                'SELECT * FROM course_applications WHERE user_id = ?',
                [req.session.user.id]
            );
            req.session.user.applications = updatedApplications;
        }

        res.redirect('/courses/dashboard');
    } catch (err) {
        console.error('❌ Error approving application:', err.message);
        res.status(500).render('admin/courses', {
            courses: [],
            error: 'Failed to approve application. Please try again.'
        });
    }
};

// Reject an application
exports.rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            console.error('Missing application ID');
            return res.status(400).json({ error: 'Application ID is required' });
        }

        const [result] = await pool.query('UPDATE course_applications SET status = ? WHERE id = ?', ['rejected', id]);
        if (result.affectedRows === 0) {
            console.error('Application not found:', id);
            return res.status(404).json({ error: 'Application not found' });
        }

        console.log('✅ Application rejected. ID:', id);
        res.redirect('/courses/dashboard');
    } catch (err) {
        console.error('❌ Error rejecting application:', err.message);
        res.status(500).render('admin/courses', {
            courses: [],
            error: 'Failed to reject application. Please try again.'
        });
    }
};

// Get course dashboard
exports.getCourseDashboard = async (req, res) => {
    try {
        const courseTitle = req.params.title;
        // Fetch course details
        const [courses] = await pool.query('SELECT * FROM courseslist WHERE title = ?', [courseTitle]);
        if (!courses || courses.length === 0) {
            return res.status(404).render('error', {
                user: req.session.user,
                error: 'Course not found.'
            });
        }
        const course = {
            ...courses[0],
            price: parseFloat(courses[0].price) || 0
        };

        // Check if user is approved for the course
        if (!req.session.user) {
            return res.redirect('/auth/login?error=Please sign in to access the course.');
        }
        const [application] = await pool.query(
            'SELECT status FROM course_applications WHERE user_id = ? AND course_key = ? AND status = ?',
            [req.session.user.id, courseTitle, 'approved']
        );
        if (!application || application.length === 0) {
            return res.redirect('/courses?error=You are not approved for this course.');
        }

        console.log('✅ Accessed course dashboard:', courseTitle);
        res.render('courseDashboard', {
            user: req.session.user,
            course,
            error: null
        });
    } catch (err) {
        console.error('❌ Error accessing course dashboard:', err.message);
        res.status(500).render('error', {
            user: req.session.user,
            error: 'Failed to load course dashboard. Please try again.'
        });
    }
};