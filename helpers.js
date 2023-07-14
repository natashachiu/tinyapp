const getUserByEmail = (email, userDatabase) => {
  for (const user in userDatabase) {
    if (email === userDatabase[user].email) {
      return userDatabase[user];
    }
  }
  return null;
};


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


const urlsForUser = (id, urlDatabase) => {
  const result = {};
  for (const urlId in urlDatabase) {
    if (id === urlDatabase[urlId].userID) {
      result[urlId] = urlDatabase[urlId];
    }
  }
  return result;
};


const loginPermissionsErrMsg = () => 'Error: Must be logged in to process request, please <a href="/login">login here<a>';

const invalidUrlErrMsg = () => 'Error: Cannot process request for invalid short URL';

const urlPermissionsErrMsg = () => 'Error: Must be owner/creator of short URL to process request';


module.exports = { getUserByEmail, generateRandomString, urlsForUser, loginPermissionsErrMsg, invalidUrlErrMsg, urlPermissionsErrMsg };