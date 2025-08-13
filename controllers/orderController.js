const db = require('../config/db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.placeOrder = (req, res) => {
    const { user_id, service_type, service_detail } = req.body;
    db.query(
        'INSERT INTO orders (user_id, service_type, service_detail) VALUES (?, ?, ?)',
        [user_id, service_type, service_detail],
        (err) => {
            if (err) throw err;
            // Send email notification to admin
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: 'New Order Placed',
                text: `New order: ${service_type} - ${service_detail} by user ${user_id}`
            });
            res.redirect('/services');
        }
    );
};