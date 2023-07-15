const express = require('express');
const morgan = require('morgan');
const methodOverride = require('method-override');
// middleware that parses raw string to cookie object
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

const { getUserByEmail, generateRandomString, urlsForUser, loginPermissionsErrMsg, invalidUrlErrMsg, urlPermissionsErrMsg } = require('./helpers');

const app = express();
app.use(morgan('dev'));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['secret'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
// make POST request body human-readable
app.use(express.urlencoded({ extended: true }));
// use EJS as template engine
app.set('view engine', 'ejs');
const PORT = 8080;


const urlDatabase = {};
const users = {};


app.get('/', (req, res) => {

  if (req.session.userid) {
    return res.redirect('/urls');
  }
  return res.redirect('/login');
});


// READ
app.get('/urls', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send(loginPermissionsErrMsg());
  }

  const templateVars = {
    urls: urlsForUser(req.session.userid, urlDatabase),
    user: users[req.session.userid]
  };

  return res.render('urls_index', templateVars);
});


// CREATE page
app.get('/urls/new', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send(loginPermissionsErrMsg());
  }
  const templateVars = { user: users[req.session.userid] };

  return res.render('urls_new', templateVars);
});


// CREATE
app.post('/urls', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send(loginPermissionsErrMsg());
  }
  const shortUrl = generateRandomString();

  urlDatabase[shortUrl] = {
    longURL: req.body.longURL,
    userID: req.session.userid,
    urlVisits: 0,
    uniqueUrlVisits: 0,
    visitors: []
  };

  return res.redirect(`/urls/${shortUrl}`);
});


// direct users from short URL to webpage
app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    console.log('error');
    return res.status(404).send(invalidUrlErrMsg());
  }

  urlDatabase[req.params.id].urlVisits++;

  // cookie to track distinct users
  if (!req.session.visitorid) {
    const visitorId = generateRandomString();
    req.session.visitorid = visitorId;
  }
  // track number of unique visits
  let uniqueVisit = false;
  for (const visit of urlDatabase[req.params.id].visitors) {
    if (req.session.visitorid === visit.id) {
      uniqueVisit = true;
    }
  }
  if (!uniqueVisit) {
    urlDatabase[req.params.id].uniqueUrlVisits++;
  }
  // add visitor id and timestamp to visitors list
  const date = new Date();
  urlDatabase[req.params.id].visitors.push({
    id: req.session.visitorid,
    timestamp: date.toLocaleString()
  });

  const longUrl = urlDatabase[req.params.id].longURL;
  return res.redirect(longUrl);
});


// EDIT page
app.get('/urls/:id', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send(loginPermissionsErrMsg());
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(invalidUrlErrMsg());
  }
  if (urlDatabase[req.params.id].userID !== req.session.userid) {
    return res.status(403).send(urlPermissionsErrMsg());
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.userid],
    visits: urlDatabase[req.params.id].urlVisits,
    uniqueVisits: urlDatabase[req.params.id].uniqueUrlVisits,
    visitors: urlDatabase[req.params.id].visitors
  };

  return res.render('urls_show', templateVars);
});


// EDIT
app.put('/urls/:id', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send(loginPermissionsErrMsg());
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(invalidUrlErrMsg());
  }
  if (urlDatabase[req.params.id].userID !== req.session.userid) {
    return res.status(403).send(urlPermissionsErrMsg());
  }
  urlDatabase[req.params.id].longURL = req.body.newUrl;

  return res.redirect('/urls');
});


// DELETE
app.delete('/urls/:id/delete', (req, res) => {
  if (!req.session.userid) {
    return res.status(403).send(loginPermissionsErrMsg());
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(invalidUrlErrMsg());
  }
  if (urlDatabase[req.params.id].userID !== req.session.userid) {
    return res.status(403).send(urlPermissionsErrMsg());
  }
  delete urlDatabase[req.params.id];

  return res.redirect('/urls');
});


// login page
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
    return res.status(403).send('Error: User not found');
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('Error: Incorrect password');
  }
  req.session.userid = user.id;

  return res.redirect('/urls');
});


// logout & clear cookie
app.post('/logout', (req, res) => {
  req.session = null;

  return res.redirect('/login');
});


// register page
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
    return res.status(400).send('Error: User has been registered with an account, please <a href="/login">login here<a>');
  }
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = {
    id,
    email,
    password: hashedPassword
  };
  req.session.userid = id;

  return res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});