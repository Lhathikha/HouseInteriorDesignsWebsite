require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/housedecor';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.error('MongoDB connection error:', err));

// Booking model
const Booking = require('./models/Booking');

// Designs data
const designs = require('./data/designs');

// Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes

// Home - show categories (Kitchen, Hall, Bedroom, Bathroom)
app.get('/', (req, res) => {
  const categories = Object.keys(designs);
  res.render('index', { categories, designs });
});

// Category page - show 3 styles for the category
app.get('/category/:category', (req, res) => {
  const { category } = req.params;
  const list = designs[category];
  if (!list) return res.status(404).send('Category not found');
  res.render('category', { category, list });
});

// Design detail page
app.get('/design/:category/:id', (req, res) => {
  const { category, id } = req.params;
  const list = designs[category];
  if (!list) return res.status(404).send('Category not found');
  const design = list.find(d => d.id === id);
  if (!design) return res.status(404).send('Design not found');
  res.render('design', { category, design });
});

// API: book
app.post('/api/book', async (req, res) => {
  try {
    const { name, contact, address, category, designId, designTitle } = req.body;
    if (!name || !contact || !address || !category || !designId || !designTitle) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const booking = new Booking({
      name, contact, address, category, designId, designTitle
    });
    await booking.save();
    return res.json({ success: true, message: 'Booking saved' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: view bookings (simple)
app.get('/admin', async (req, res) => {
  const bookings = await Booking.find({}).sort({ createdAt: -1 }).lean();
  res.render('admin', { bookings });
});

// Simple API to fetch bookings (optional)
app.get('/api/bookings', async (req, res) => {
  const bookings = await Booking.find({}).sort({ createdAt: -1 }).lean();
  res.json({ success: true, bookings });
});

// Start
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
