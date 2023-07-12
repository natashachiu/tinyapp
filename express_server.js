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
  sgq3y6: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

  if (req.cookies.user_id) {
    return res.redirect('/urls');
  }
  return res.redirect('/login');
});


// READ
app.get('/urls', (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(403).send('Error: Must be logged in to display your URLs');
  }

  const templateVars = {
    urls: urlsForUser(req.cookies.user_id),
    user: users[req.cookies.user_id]
  };

  return res.render('urls_index', templateVars);
});

// CREATE page
app.get('/urls/new', (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(403).send('Error: Must be logged in to create new short URLs');
  }

  const templateVars = { user: users[req.cookies.user_id] };

  return res.render('urls_new', templateVars);
});

// CREATE
app.post('/urls', (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(403).send('Error: Must be logged in to create new short URLs');
  }

  const shortUrl = generateRandomString();

  urlDatabase[shortUrl] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
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
  if (!req.cookies.user_id) {
    return res.status(403).send('Error: Must be logged in to access individual URL pages');
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(`Error: Cannot access URL page for invalid short URL '${req.params.id}'`);
  }
  if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
    return res.status(403).send('Error: You may only access URL pages that belong to you');
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies.user_id]
  };

  return res.render('urls_show', templateVars);
});

// EDIT
app.post('/urls/:id', (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(403).send('Error: Must be logged in to edit URLs');
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(`Error: Cannot edit URL for invalid short URL '${req.params.id}'`);
  }
  if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
    return res.status(403).send('Error: You may only edit URLs that belong to you');
  }

  urlDatabase[req.params.id].longURL = req.body.newUrl;

  res.redirect('/urls');
});


// DELETE
// (a POST method as forms only support GET & POST)
app.post('/urls/:id/delete', (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(403).send('Error: Must be logged in to delete URLs');
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(`Error: Cannot delete URL for invalid short URL '${req.params.id}'`);
  }
  if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
    return res.status(403).send('Error: You may only delete URLs that belong to you');
  }

  delete urlDatabase[req.params.id];

  return res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };

  if (req.cookies.user_id) {
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

  const user = getUserByEmail(email);

  if (!user) {
    return res.status(403).send(`Error: '${email}' is not registered with an account`);
  }
  if (password !== user.password) {
    return res.status(403).send(`Error: Incorrect password for '${email}'`);
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
  if (req.cookies.user_id) {
    return res.redirect('/urls');
  }

  const templateVars = { user: users[req.cookies.user_id] };

  return res.render('register', templateVars);
});

// register, add user to database & set cookie
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Error: Email or password is empty');
  }
  if (getUserByEmail(email)) {
    return res.status(400).send(`Error: '${email}' is already registered with an account`);
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

const urlsForUser = (id) => {
  const result = {};
  for (const urlId in urlDatabase) {
    if (id === urlDatabase[urlId].userID) {
      result[urlId] = urlDatabase[urlId];
    }
  }
  return result;
};