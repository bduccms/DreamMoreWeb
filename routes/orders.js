const express = require('express');
const router = express.Router();
const db = require('../config/db');
const nodemailer = require('nodemailer');

// Place an order
router.post('/place', async (req, res) => {
    const { user_id, service_detail } = req.body;
    res.redirect('/thank-you');


    // Insert order into DB
    const sql = `
        INSERT INTO orders (user_id, service_detail)
        VALUES (?, ?)
    `;

    db.query(sql, [user_id, service_detail], async (err, result) => {
        if (err) {
            console.error('❌ DB Insert Error:', err);
            return res.status(500).send('Error placing order.');
        }

        // Fetch user details for email
        db.query('SELECT first_name, last_name, email, phone FROM users WHERE id = ?', [user_id], async (userErr, rows) => {
            if (userErr || rows.length === 0) {
                console.error('❌ User Fetch Error:', userErr);
                return res.status(500).send('Order saved, but failed to fetch user info.');
            }

            const user = rows[0];
            const userName = `${user.first_name} ${user.last_name}`;

            // Send email notification to admin
            try {
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.ADMIN_EMAIL,
                        pass: process.env.ADMIN_PASS
                    }
                });

                await transporter.sendMail({
                    from: `"Order Notification" <${process.env.ADMIN_EMAIL}>`,
                    to: process.env.ADMIN_EMAIL,
                    subject: '📥 New Project Order Received',
                    text: `
A new project order has been placed:

👤 User Name: ${userName}
📧 Email: ${user.email}
📞 Phone: ${user.phone}
📝 Service: ${service_detail}

Check the admin dashboard for details.
                    `
                });

                console.log('✅ Email sent to admin.');
                res.redirect('/thank-you'); // Redirect to a thank you page
            } catch (mailError) {
                console.error('❌ Email Error:', mailError);
                res.status(500).send('Order saved, but failed to send email.');
            }
        });
    });
});

module.exports = router;
