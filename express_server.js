const express = require('express');
const morgan = require('morgan');
const methodOverride = require('method-override');
// middleware that parses raw string to cookie object
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

const { getUserByEmail } = require('./helpers');

const app = express();
app.use(morgan('dev'));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['secret'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
const PORT = 8080;
// use EJS as template engine
app.set('view engine', 'ejs');

// make POST request body human-readable
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  //   sgq3y6: {
  //     longURL: "https://www.tsn.ca",
  //     userID: "aJ48lW",
  //   },
  //   i3BoGr: {
  //     longURL: "https://www.google.ca",
  //     userID: "aJ48lW",
  // },
};

const users = {
  1: {
    id: '1',
    email: "jon@example.com",
    password: bcrypt.hashSync('pass1', 10),
  },
  2: {
    id: '2',
    email: "may@example.com",
    password: bcrypt.hashSync('pass2', 10),
  },
};


app.get('/', (req, res) => {

  if (req.session.userid) {
    return res.redirect('/urls');
  }
  return res.redirect('/login');
});


// READ
app.get('/urls', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send('Error: Must be logged in to display your URLs, please <a href="/login">login here<a>');
  }

  const templateVars = {
    urls: urlsForUser(req.session.userid),
    user: users[req.session.userid]
  };

  return res.render('urls_index', templateVars);
});

// CREATE page
app.get('/urls/new', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send('Error: Must be logged in to create new short URLs');
  }

  const templateVars = { user: users[req.session.userid] };

  return res.render('urls_new', templateVars);
});

// CREATE
app.post('/urls', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send('Error: Must be logged in to create new short URLs');
  }

  const shortUrl = generateRandomString();

  urlDatabase[shortUrl] = {
    longURL: req.body.longURL,
    userID: req.session.userid
  };

  return res.redirect(`/urls/${shortUrl}`);
});

// direct users from short URL to webpage
// route parameters return an object
app.get('/u/:id', (req, res) => {
  const longUrl = urlDatabase[req.params.id].longURL;

  if (!longUrl) {
    return res.status(404).send(`Error: Cannot retrieve webpage for invalid short URL '${req.params.id}'`);
  }

  return res.redirect(longUrl);
});

// EDIT page
app.get('/urls/:id', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send('Error: Must be logged in to access individual URL pages');
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(`Error: Cannot access URL page for invalid short URL '${req.params.id}'`);
  }
  if (urlDatabase[req.params.id].userID !== req.session.userid) {
    return res.status(403).send('Error: You may only access URL pages that belong to you');
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.userid]
  };

  return res.render('urls_show', templateVars);
});

// EDIT
app.put('/urls/:id', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send('Error: Must be logged in to edit URLs');
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(`Error: Cannot edit URL for invalid short URL '${req.params.id}'`);
  }
  if (urlDatabase[req.params.id].userID !== req.session.userid) {
    return res.status(403).send('Error: You may only edit URLs that belong to you');
  }

  urlDatabase[req.params.id].longURL = req.body.newUrl;

  res.redirect('/urls');
});


// DELETE
app.delete('/urls/:id/delete', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send('Error: Must be logged in to delete URLs');
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(`Error: Cannot delete URL for invalid short URL '${req.params.id}'`);
  }
  if (urlDatabase[req.params.id].userID !== req.session.userid) {
    return res.status(403).send('Error: You may only delete URLs that belong to you');
  }

  delete urlDatabase[req.params.id];

  return res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.userid] };

  if (req.session.userid) {
    return res.redirect('/urls');
  }

  return res.render('login', templateVars);
});

// login & set cookie
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Error: Email or password is empty');
  }

  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).send(`Error: '${email}' is not registered with an account`);
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send(`Error: Incorrect password for '${email}'`);
  }

  req.session.userid = user.id;

  return res.redirect('/urls');
});

// logout & clear cookie
app.post('/logout', (req, res) => {
  req.session = null;

  return res.redirect('/login');
});

app.get('/register', (req, res) => {
  if (req.session.userid) {
    return res.redirect('/urls');
  }

  const templateVars = { user: users[req.session.userid] };

  return res.render('register', templateVars);
});

// register, add user to database & set cookie
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Error: Email or password is empty');
  }
  if (getUserByEmail(email, users)) {
    return res.status(400).send(`Error: '${email}' is already registered with an account, please <a href='/login'>login<a>`);
  }

  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = { id, email, password: hashedPassword };

  req.session.userid = id;

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



const urlsForUser = (id) => {
  const result = {};
  for (const urlId in urlDatabase) {
    if (id === urlDatabase[urlId].userID) {
      result[urlId] = urlDatabase[urlId];
    }
  }
  return result;
};