const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;


const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});


app.use(bodyParser.json());

app.use(cors()); 


const initDb = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL
        );
    `);
};

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const userExists = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [email, hashedPassword]
        );

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registering user' });
    }
});



app.post('/change-password', async (req, res) => {
    console.log(JSON.stringify(req.body))
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
        const result = await pool.query('SELECT id, password FROM users WHERE username = $1', [username]);
  
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
  
        await pool.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, username]);
  
        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in' });
    }
});


function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
}

app.post('/verify-token', (req, res) => {
    const { token } = req.body;
    const decoded = verifyToken(token);
    if (decoded) {
        res.json({ isValid: true });
    } else {
        res.json({ isValid: false });
    }
});


app.get('/protected', authenticateJWT, (req, res) => {
    res.json({ message: `Hello, ${req.user.username}. This is a protected route.` });
});


const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        return null; 
    }
};

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`DB connections successfull !! Server running on http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to initialize the database', error);
});
