const { assert } = require('chai');

const { getUserByEmail, urlsForUser } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrls = {
  "shortUrlID": {
    longURL: "example.org",
    userID: "userRandomID"
  },
  "shortUrl2ID": {
    longURL: "google.com",
    userID: "user2RandomID"
  }
};

describe('#getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail('user@example.com', testUsers);
    const expectedUserId = 'userRandomID';

    assert.equal(expectedUserId, user.id);
  });

  it('should return undefined when provided with an invalid user email', () => {
    const user = getUserByEmail('test@example.com', testUsers);

    assert.equal(undefined, user);
  });
});

describe('#urlsForUser', () => {
  it('should return list of URL objects made by a given user when provided with a valid user ID', () => {
    const userUrlDatabase = urlsForUser('userRandomID', testUrls);
    const expectedResult = {
      "shortUrlID": {
        longURL: "example.org",
        userID: "userRandomID"
      }
    };

    assert.deepEqual(expectedResult, userUrlDatabase);
  });

  it('should return empty object when provided with an invalid user ID', () => {
    const userUrlDatabase = urlsForUser('invalidUser', testUrls);

    assert.deepEqual({}, userUrlDatabase);
  });
});
