const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/myapp', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: true
}));

app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.render('index');
  }
});

app.get('/FtoCDash', (req, res) => res.render('FtoCDash'));
app.get('/shop',(req,res)=> res.render('shop'));
app.get('/checkout',(req,res)=> res.render('checkout'));

app.get('/signin', (req, res) => res.render('signin'));
app.get('/signup', (req, res) => res.render('signup'));
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.send('Email already registered');
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hashedPassword });
  await newUser.save();
  res.redirect('/signin');
});

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) return res.send('Invalid credentials');
  req.session.user = user;
  res.redirect('/home');
});

app.get('/home', (req, res) => {
  if (!req.session.user) return res.redirect('/signin');
  res.render('home', { user: req.session.user });
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/signin');
  const user = await User.findById(req.session.user._id);
  const districtName = "dashboard";
  let district = user.districts.find(d => d.name === districtName);
  if (district) district.footsteps += 1;
  else user.districts.push({ name: districtName, footsteps: 1 });
  user.points = user.districts.reduce((t, d) => t + d.footsteps, 0);
  await user.save();
  res.render('dashboard', { user });
});

app.get('/leaderboard', async (req, res) => {
  const users = await User.find().sort({ points: -1 });
  res.render('leaderboard', { users });
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.send('Error logging out');
    res.redirect('/');
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
