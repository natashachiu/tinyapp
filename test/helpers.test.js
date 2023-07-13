const { assert } = require('chai');

const { getUserByEmail } = require('../helpers');

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