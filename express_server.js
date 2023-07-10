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

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.post('/urls', (req, res) => {
  const shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL;

  res.redirect(`/u/${shortUrl}`);
});

// accept different route parameters
app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.statusCode = 404;
    res.send("invalid short URL");
  }

  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);

  // const templateVars = {
  //   id: req.params.id,
  //   longURL: urlDatabase[req.params.id]
  // };
  // res.render('urls_show', templateVars);
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



app.get('/', (request, response) => {
  response.send('Hello!');
});
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b> </body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});