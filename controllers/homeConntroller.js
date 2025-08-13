const pool = require('../config/db');

exports.getHome = async (req, res) => {
    try {
        // Fetch courses for the homepage
        const [courses] = await pool.query('SELECT * FROM courseslist ORDER BY id DESC');
        // Ensure price is a number
        const formattedCourses = courses.map(course => ({
            ...course,
            price: parseFloat(course.price) || 0
        }));
        let applications = [];
        let enrolledCourses = [];
        if (req.session.user) {
            // Fetch user applications with course details
            [applications] = await pool.query(`
                SELECT ca.course_key, ca.status, c.title, c.description, c.photo, c.price
                FROM course_applications ca
                LEFT JOIN courseslist c ON ca.course_key = c.title
                WHERE ca.user_id = ?
            `, [req.session.user.id]);
            enrolledCourses = applications
                .filter(app => app.status === 'approved' && app.title)
                .map(app => app.title.trim());
            applications = applications.map(app => ({
                ...app,
                course: app.title ? {
                    title: app.title,
                    description: app.description,
                    photo: app.photo,
                    price: parseFloat(app.price) || 0
                } : null
            }));
            console.log('✅ Home: Fetched courses:', formattedCourses.length, 'Enrolled courses:', enrolledCourses, 'Applications:', applications, 'User ID:', req.session.user.id);
        } else {
            console.log('✅ Home: Fetched courses:', formattedCourses.length, 'No user logged in');
        }
        res.render('home', {
            user: req.session.user ? { ...req.session.user, enrolledCourses, applications } : null,
            courses: formattedCourses || [],
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error('❌ Error fetching homepage data:', err.message);
        res.status(500).render('home', {
            user: req.session.user,
            courses: [],
            error: 'Failed to load homepage. Please try again.',
            success: null
        });
    }
};