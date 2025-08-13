```
dreammore-website/
├── config/
│   └── db.js                # Database connection configuration
├── controllers/
│   ├── authController.js    # Authentication logic (sign-up, sign-in)
│   ├── courseController.js  # Course-related logic
│   ├── orderController.js   # Order-related logic
│   ├── contactController.js # Contact form logic
│   ├── adminController.js   # Admin dashboard logic
│   ├── workerController.js  # Worker dashboard logic
├── models/
│   ├── User.js             # User model
│   ├── Course.js           # Course model
│   ├── Order.js            # Order model
│   ├── Payment.js          # Payment model
│   ├── Enrollment.js       # Enrollment model
│   ├── ContactMessage.js   # Contact message model
│   ├── CourseMaterial.js   # Course material model
├── public/
│   ├── css/
│   │   └── styles.css      # Custom CSS (updated for new classes)
│   ├── js/
│   │   └── scripts.js      # Custom JavaScript (includes carousel)
│   └── Uploads/            # Uploaded files (images, videos, payment screenshots, course materials)
├── views/
│   ├── partials/
│   │   ├── header.ejs      # Navigation header
│   │   └── footer.ejs      # Footer
│   ├── home.ejs            # Main single-page template
│   ├── services.ejs        # Services section
│   ├── courses.ejs         # Courses section
│   ├── portfolio.ejs       # Portfolio section
│   ├── about.ejs          # About section
│   ├── teams.ejs          # Teams section
│   ├── testimonials.ejs   # Testimonials section
│   ├── contact.ejs         # Contact section
│   ├── admin/
│   │   ├── dashboard.ejs   # Admin dashboard overview
│   │   ├── users.ejs       # Manage users
│   │   ├── students.ejs    # Manage students
│   │   ├── workers.ejs     # Manage workers
│   │   ├── payments.ejs    # Manage payments
│   │   └── courses.ejs     # Manage courses
│   ├── worker/
│   │   └── dashboard.ejs   # Worker dashboard for material uploads
│   └── courses/
│       └── dashboard.ejs   # Student course dashboard
├── .env                    # Environment variables
├── package.json            # Node.js dependencies and scripts
├── server.js               # Main server file
└── README.md               # Project documentation
```

---

### Setup Instructions
1. **Initialize the Project**:
   - Create a new directory: `mkdir dreammore-website && cd dreammore-website`
   - Initialize Node.js: `npm init -y`
   - Install dependencies:
     ```bash
     npm install express ejs mysql2 express-session bcryptjs dotenv nodemailer multer helmet
     npm install bootstrap@5.3.3
     ```

2. **Set Up Environment Variables**:
   - Create a `.env` file:

<xaiArtifact artifact_id="625855b4-1517-4769-bf15-12ebbef6d6aa" artifact_version_id="464242b1-a92e-4ca3-909c-df2627b0264e" title=".env" contentType="text/plain">
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dreammore_db
SESSION_SECRET=your_session_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password