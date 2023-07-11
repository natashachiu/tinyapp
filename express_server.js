const express = require('express');
const app = express();
const PORT = 8080;

// use EJS as template engine
app.set('view engine', 'ejs');

// make POST request body human-readable
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// READ
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };

  return res.render('urls_index', templateVars);
});

// CREATE page
app.get('/urls/new', (req, res) => {
  return res.render('urls_new');
});

// CREATE
app.post('/urls', (req, res) => {
  const shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL;

  return res.redirect(`/urls/${shortUrl}`);
});

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
    longURL: urlDatabase[req.params.id]
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

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);

  res.redirect('/urls');
});


app.get('/', (req, res) => {
  res.send('Hello!');
});
app.get('/urls.json', (req, res) => {
  // translate JS object to JSON to be browser-readable
  res.json(urlDatabase);
});
app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b> </body></html>\n');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});


const generateRandomString = function() {
  let randomStr = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6;

  for (let i = 0; i < length; i++) {
    const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
    randomStr += randomChar;
  }

  return randomStr;
};