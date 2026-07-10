require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'secretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

let db;

// Connect to MySQL with retry
async function connectDB() {
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };

  let retries = 5;
  while (retries > 0) {
    try {
      db = await mysql.createConnection(dbConfig);
      console.log('MySQL connected successfully.');
      
      // Ensure default admin user exists
      await seedAdminUser();
      break;
    } catch (err) {
      console.error(`Database connection failed. Retries left: ${retries - 1}. Error:`, err.message);
      retries -= 1;
      if (retries === 0) {
        console.error('Could not connect to MySQL. Exiting...');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
    }
  }
}

// Seed admin user (admin / admin123) if none exists
async function seedAdminUser() {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', ['admin']);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query(
        'INSERT INTO users (username, password, fullname) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'Administrator']
      );
      console.log('Default admin user created (username: admin, password: admin123)');
    }
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
}

// Authentication Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized. Please login first.' });
  }
}

// --- Auth Routes ---

// Register
app.post('/api/register', async (req, res) => {
  const { username, password, fullname } = req.body;
  if (!username || !password || !fullname) {
    return res.status(400).json({ message: 'Vui long nhap day du thong tin' });
  }

  try {
    // Check if user exists
    const [existing] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ten dang nhap da ton tai' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    await db.query(
      'INSERT INTO users (username, password, fullname) VALUES (?, ?, ?)',
      [username, hashedPassword, fullname]
    );

    res.status(201).json({ message: 'Dang ky thanh cong' });
  } catch (err) {
    res.status(500).json({ message: 'Loi he thong', error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Vui long nhap tai khoan & mat khau' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Tai khoan hoac mat khau sai' });
    }

    const user = rows[0];

    // Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Tai khoan hoac mat khau sai' });
    }

    // Save session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.fullname = user.fullname;

    res.json({
      message: 'Dang nhap thanh cong',
      user: { id: user.id, username: user.username, fullname: user.fullname }
    });
  } catch (err) {
    res.status(500).json({ message: 'Loi he thong', error: err.message });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Khong the dang xuat' });
    }
    res.json({ message: 'Dang xuat thanh cong' });
  });
});

// Get profile
app.get('/api/me', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      loggedIn: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        fullname: req.session.fullname
      }
    });
  } else {
    res.json({ loggedIn: false });
  }
});


// --- Student CRUD Routes (Protected) ---

// Read All (with Search)
app.get('/api/students', requireAuth, async (req, res) => {
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM students ORDER BY id DESC';
    let params = [];

    if (search) {
      query = 'SELECT * FROM students WHERE fullname LIKE ? OR student_code LIKE ? OR major LIKE ? ORDER BY id DESC';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam, searchParam];
    }

    const [students] = await db.query(query, params);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Loi khi lay danh sach sinh vien', error: err.message });
  }
});

// Read Single
app.get('/api/students/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Khong tim thay sinh vien' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Loi', error: err.message });
  }
});

// Create
app.post('/api/students', requireAuth, async (req, res) => {
  const { student_code, fullname, email, major, gpa } = req.body;
  if (!student_code || !fullname || !email || !major) {
    return res.status(400).json({ message: 'Vui long nhap day du thong tin bat buoc' });
  }

  try {
    // Check code unique
    const [existing] = await db.query('SELECT * FROM students WHERE student_code = ?', [student_code]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ma so sinh vien da ton tai' });
    }

    await db.query(
      'INSERT INTO students (student_code, fullname, email, major, gpa) VALUES (?, ?, ?, ?, ?)',
      [student_code, fullname, email, major, gpa || 0.0]
    );

    res.status(201).json({ message: 'Them sinh vien thanh cong' });
  } catch (err) {
    res.status(500).json({ message: 'Loi khi them sinh vien', error: err.message });
  }
});

// Update
app.put('/api/students/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { student_code, fullname, email, major, gpa } = req.body;

  if (!student_code || !fullname || !email || !major) {
    return res.status(400).json({ message: 'Vui long nhap day du thong tin bat buoc' });
  }

  try {
    // Check if student exists
    const [existing] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Khong tim thay sinh vien' });
    }

    // Check code unique (if changed)
    const [codeCheck] = await db.query('SELECT * FROM students WHERE student_code = ? AND id != ?', [student_code, id]);
    if (codeCheck.length > 0) {
      return res.status(400).json({ message: 'Ma so sinh vien da bi trung lap' });
    }

    await db.query(
      'UPDATE students SET student_code = ?, fullname = ?, email = ?, major = ?, gpa = ? WHERE id = ?',
      [student_code, fullname, email, major, gpa || 0.0, id]
    );

    res.json({ message: 'Cap nhat thong tin sinh vien thanh cong' });
  } catch (err) {
    res.status(500).json({ message: 'Loi khi cap nhat sinh vien', error: err.message });
  }
});

// Delete
app.delete('/api/students/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Khong tim thay sinh vien' });
    }

    await db.query('DELETE FROM students WHERE id = ?', [id]);
    res.json({ message: 'Xoa sinh vien thanh cong' });
  } catch (err) {
    res.status(500).json({ message: 'Loi khi xoa sinh vien', error: err.message });
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectDB();
});
