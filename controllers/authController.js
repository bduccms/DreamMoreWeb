const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.register = async (req, res) => {
  const { firstName, lastName, phoneNumber, email, password, role } = req.body;

  try {
    if (!firstName || !lastName || !phoneNumber || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields except role are required' });
    }

    const userRole = ['admin', 'worker', 'student'].includes(role) ? role : 'student';

    // Check if email exists
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (first_name, last_name, phone_number, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, phoneNumber, email, hashedPassword, userRole]
    );

    res.status(201).json({ success: true, message: `Registered successfully as ${userRole}` });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};



exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user by email
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];

    // Compare hashed passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Set user session info (optional, if using sessions)
    req.session.user = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role
    };

    return res.json({ success: true, message: 'Login successful', user: req.session.user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};


// logout function
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // clear session cookie
    res.json({ success: true, message: 'Logged out successfully' });
  });
};
