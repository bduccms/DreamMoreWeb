const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

// Routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const workerRoutes = require('./routes/worker'); // ✅ workers route
const testimonialRoutes = require('./routes/testimonial');
const portfolioRoutes = require('./routes/portfolio');

// Database connection (promise-based)
const db = require('./config/db');

dotenv.config();
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Middleware to make `user` available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ✅ Fix for case-sensitive uploads folder
app.use('/Uploads', express.static(path.join(__dirname, 'public/Uploads')));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer config for file uploads (with correct folder case)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/Uploads')); // ✅ capital U
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// 🛠️ Use routes
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes); 
app.use('/admin/workers', workerRoutes); // ✅ mount worker routes here
app.use('/', testimonialRoutes);
app.use('/', portfolioRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'public/Uploads'))); // ✅ serve uploaded files with correct case

// ✅ Home route fetching testimonials and courses
app.get('/', async (req, res) => {
    try {
        const [testimonials] = await db.query("SELECT * FROM testimonials");
        const [courses] = await db.query("SELECT * FROM courseslist");
        const formattedCourses = courses.map(course => ({
            ...course,
            price: parseFloat(course.price) || 0
        }));
        res.render('home', { 
            courses: formattedCourses || [], 
            testimonials: testimonials || [], 
            error: null 
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.render('home', { 
            courses: [], 
            testimonials: [], 
            error: 'Failed to load courses or testimonials' 
        });
    }
});

// ✅ Static routes
app.get('/services', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        const formattedCourses = courses.map(course => ({
            ...course,
            price: parseFloat(course.price) || 0
        }));
        res.render('services', { 
            courses: formattedCourses || [], 
            error: null 
        });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('services', { 
            courses: [], 
            error: 'Failed to load courses' 
        });
    }
});

app.get('/portfolio', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        const formattedCourses = courses.map(course => ({
            ...course,
            price: parseFloat(course.price) || 0
        }));
        res.render('portfolio', { 
            courses: formattedCourses || [], 
            error: null 
        });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('portfolio', { 
            courses: [], 
            error: 'Failed to load courses' 
        });
    }
});

app.get('/about', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        const formattedCourses = courses.map(course => ({
            ...course,
            price: parseFloat(course.price) || 0
        }));
        res.render('about', { 
            courses: formattedCourses || [], 
            error: null 
        });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('about', { 
            courses: [], 
            error: 'Failed to load courses' 
        });
    }
});

app.get('/teams', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        const formattedCourses = courses.map(course => ({
            ...course,
            price: parseFloat(course.price) || 0
        }));
        res.render('teams', { 
            courses: formattedCourses || [], 
            error: null 
        });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('teams', { 
            courses: [], 
            error: 'Failed to load courses' 
        });
    }
});

app.get('/contact', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        const formattedCourses = courses.map(course => ({
            ...course,
            price: parseFloat(course.price) || 0
        }));
        res.render('contact', { 
            courses: formattedCourses || [], 
            error: null 
        });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('contact', { 
            courses: [], 
            error: 'Failed to load courses' 
        });
    }
});

// ✅ Thank you route
app.get('/thank-you', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        const formattedCourses = courses.map(course => ({
            ...course,
            price: parseFloat(course.price) || 0
        }));
        res.render('thank-you', { 
            courses: formattedCourses || [], 
            error: null 
        });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('thank-you', { 
            courses: [], 
            error: 'Failed to load courses' 
        });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
