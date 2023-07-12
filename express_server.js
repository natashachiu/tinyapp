const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();
app.use(morgan('dev'));
app.use(cookieParser());
const PORT = 8080;
// use EJS as template engine
app.set('view engine', 'ejs');

// make POST request body human-readable
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  1: {
    id: '1',
    email: "jon@example.com",
    password: "pass1",
  },
  2: {
    id: '2',
    email: "may@example.com",
    password: "pass2",
  },
};


app.get('/', (req, res) => {

  return res.redirect('/urls');
});

// TODO: logged in home page

// READ
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };

  return res.render('urls_index', templateVars);
});

// CREATE page
app.get('/urls/new', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };

  return res.render('urls_new', templateVars);
});

// CREATE
app.post('/urls', (req, res) => {
  const shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL;

  return res.redirect(`/urls/${shortUrl}`);
});

// direct users from short URL to webpage
// route parameters return an object
app.get('/u/:id', (req, res) => {
  const longUrl = urlDatabase[req.params.id];

  if (!longUrl) {
    res.statusCode = 404;
    return res.send(`Cannot GET invalid short URL ${req.params.id}`);
  }

  return res.redirect(longUrl);
});

// EDIT page
app.get('/urls/:id', (req, res) => {

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies.user_id]
  };
  return res.render('urls_show', templateVars);
});

// EDIT
app.post('/urls/:id', (req, res) => {

  urlDatabase[req.params.id] = req.body.newUrl;

  res.redirect('/urls');
});


// DELETE
// (a POST method as forms only support GET & POST)
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];

  return res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };

  return res.render('login', templateVars);
});

// login & set cookie
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('email or password is empty');
  }

  const user = getUserByEmail(email);

  if (!user) {
    return res.status(403).send(`${email} is not registered with an account`);
  }
  if (password !== user.password) {
    return res.status(403).send(`incorrect password for ${email}`);
  }
  res.cookie('user_id', user.id);

  return res.redirect('/urls');
});

// logout & clear cookie
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');

  return res.redirect('/login');
});

app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };

  res.render('register', templateVars);
});

// register, add user to database & set cookie
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('email or password is empty');
  }
  if (getUserByEmail(email)) {
    return res.status(400).send(`${email} is already registered with an account`);
  }

  const id = generateRandomString();
  users[id] = { id, email, password };

  res.cookie('user_id', id);

  // console.log(users);
  return res.redirect('/urls');
});


app.get('/urls.json', (req, res) => {
  // translate JS object to JSON to be browser-readable
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});


const generateRandomString = () => {
  let randomStr = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6;

  for (let i = 0; i < length; i++) {
    const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
    randomStr += randomChar;
  }

  return randomStr;
};

const getUserByEmail = (email) => {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return null;
};