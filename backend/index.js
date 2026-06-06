const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'purihafea-secret-key-2024';

// ========== DATABASE ==========
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // kosongkan jika XAMPP default
  database: 'purihafea',
  waitForConnections: true,
  connectionLimit: 10,
});

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== MULTER (file upload) ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.uploadFolder || 'uploads';
    cb(null, path.join(__dirname, folder));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ========== AUTH MIDDLEWARE ==========
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
};

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ========== AUTH ==========

// Register
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Semua field wajib diisi' });

    const [existing] = await db.execute('SELECT id FROM owners WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const shopId = Math.random().toString(36).substring(2, 10);

    await db.execute(
      'INSERT INTO owners (id, name, email, password, shop_id) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, shopId]
    );

    res.json({ success: true, shopId, message: 'Akun berhasil dibuat' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });

    const [rows] = await db.execute('SELECT * FROM owners WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Email atau password salah' });

    const owner = rows[0];
    const valid = await bcrypt.compare(password, owner.password);
    if (!valid) return res.status(401).json({ error: 'Email atau password salah' });

    const accessToken = jwt.sign({ userId: owner.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      accessToken,
      owner: { id: owner.id, name: owner.name, email: owner.email, shopId: owner.shop_id }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name, email, shop_id FROM owners WHERE id = ?', [req.userId]);
    if (rows.length === 0) return res.status(401).json({ error: 'User tidak ditemukan' });
    const o = rows[0];
    res.json({ owner: { id: o.id, name: o.name, email: o.email, shopId: o.shop_id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== PRODUCTS ==========

// Upload product image
app.post('/api/upload/product', authMiddleware, (req, res) => {
  req.uploadFolder = 'uploads/products';
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Tidak ada file' });
    res.json({ fileName: req.file.filename });
  });
});

// Add product
app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    const { name, price, stock, photoFileName } = req.body;
    if (!name || !price || stock === undefined || !photoFileName) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    const id = uuidv4();
    const photoUrl = `http://localhost:${PORT}/uploads/products/${photoFileName}`;

    await db.execute(
      'INSERT INTO products (id, owner_id, name, price, stock, photo_filename) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.userId, name, price, stock, photoFileName]
    );

    res.json({ success: true, product: { id, name, price, stock, photoFileName, photoUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all products for owner
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products WHERE owner_id = ? ORDER BY created_at DESC', [req.userId]);
    const products = rows.map(p => ({
      ...p,
      photoUrl: p.photo_filename ? `http://localhost:${PORT}/uploads/products/${p.photo_filename}` : null
    }));
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== PAYMENT METHODS ==========

// Upload QRIS image
app.post('/api/upload/qris', authMiddleware, (req, res) => {
  req.uploadFolder = 'uploads/qris';
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Tidak ada file' });
    res.json({ fileName: req.file.filename });
  });
});

// Set payment methods
app.post('/api/payment-methods', authMiddleware, async (req, res) => {
  try {
    const { methods } = req.body;

    // Hapus metode lama dulu
    await db.execute('DELETE FROM payment_methods WHERE owner_id = ?', [req.userId]);

    // Insert metode baru
    for (const method of methods) {
      const qrisUrl = method.qrisFileName
        ? `http://localhost:${PORT}/uploads/qris/${method.qrisFileName}`
        : null;

      await db.execute(
        'INSERT INTO payment_methods (owner_id, type, account_name, account_number, bank_name, qris_filename) VALUES (?, ?, ?, ?, ?, ?)',
        [req.userId, method.type, method.accountName || null, method.accountNumber || null, method.bankName || null, method.qrisFileName || null]
      );
    }

    const methodsWithUrls = methods.map(m => ({
      ...m,
      qrisUrl: m.qrisFileName ? `http://localhost:${PORT}/uploads/qris/${m.qrisFileName}` : null
    }));

    res.json({ success: true, methods: methodsWithUrls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment methods
app.get('/api/payment-methods', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM payment_methods WHERE owner_id = ?', [req.userId]);
    const methods = rows.map(m => ({
      type: m.type,
      accountName: m.account_name,
      accountNumber: m.account_number,
      bankName: m.bank_name,
      qrisFileName: m.qris_filename,
      qrisUrl: m.qris_filename ? `http://localhost:${PORT}/uploads/qris/${m.qris_filename}` : null
    }));
    res.json({ methods });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== CUSTOMER ENDPOINTS ==========

// Get shop info by shopId
app.get('/api/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    const [ownerRows] = await db.execute('SELECT id, name FROM owners WHERE shop_id = ?', [shopId]);
    if (ownerRows.length === 0) return res.status(404).json({ error: 'Toko tidak ditemukan' });

    const owner = ownerRows[0];

    const [productRows] = await db.execute('SELECT * FROM products WHERE owner_id = ?', [owner.id]);
    const products = productRows.map(p => ({
      ...p,
      photoUrl: p.photo_filename ? `http://localhost:${PORT}/uploads/products/${p.photo_filename}` : null
    }));

    const [paymentRows] = await db.execute('SELECT * FROM payment_methods WHERE owner_id = ?', [owner.id]);
    const paymentMethods = paymentRows.map(m => ({
      type: m.type,
      accountName: m.account_name,
      accountNumber: m.account_number,
      bankName: m.bank_name,
      qrisFileName: m.qris_filename,
      qrisUrl: m.qris_filename ? `http://localhost:${PORT}/uploads/qris/${m.qris_filename}` : null
    }));

    res.json({
      shop: { ownerId: owner.id, name: owner.name },
      products,
      paymentMethods
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload payment proof
app.post('/api/upload/payment-proof', (req, res) => {
  req.uploadFolder = 'uploads/payments';
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Tidak ada file' });
    res.json({ fileName: req.file.filename });
  });
});

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const { shopId, customerName, address, items, paymentMethod, paymentProofFileName } = req.body;

    if (!shopId || !customerName || !address || !items || !paymentMethod) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    const [ownerRows] = await db.execute('SELECT id FROM owners WHERE shop_id = ?', [shopId]);
    if (ownerRows.length === 0) return res.status(404).json({ error: 'Toko tidak ditemukan' });

    const ownerId = ownerRows[0].id;
    const orderId = uuidv4();

    await db.execute(
      'INSERT INTO orders (id, owner_id, shop_id, customer_name, address, payment_method, payment_proof_filename) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderId, ownerId, shopId, customerName, address, paymentMethod, paymentProofFileName || null]
    );

    for (const item of items) {
      await db.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.id, item.name, item.price, item.quantity]
      );
    }

    res.json({ success: true, order: { id: orderId, status: 'pending' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders for owner
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE owner_id = ? ORDER BY created_at DESC',
      [req.userId]
    );

    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      return {
        id: order.id,
        customerName: order.customer_name,
        address: order.address,
        paymentMethod: order.payment_method,
        paymentProofUrl: order.payment_proof_filename
          ? `http://localhost:${PORT}/uploads/payments/${order.payment_proof_filename}`
          : null,
        status: order.status,
        createdAt: order.created_at,
        items: items.map(i => ({
          id: i.product_id,
          name: i.product_name,
          price: Number(i.price),
          quantity: i.quantity
        }))
      };
    }));

    res.json({ orders: ordersWithItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== START ==========
app.listen(PORT, () => {
  console.log(`✅ Backend berjalan di http://localhost:${PORT}`);
  console.log(`📦 Upload folder: ${path.join(__dirname, 'uploads')}`);
});
