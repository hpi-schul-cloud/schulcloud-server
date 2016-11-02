'use strict';

const chai = require('chai');
const assert = require('assert');
const promisify = require("es6-promisify");
const LernsaxLoginStrategy = require('../../../src/services/authentication/strategies/lernsax.js');
var should = chai.should();

describe('Lernsax single-sign-on', function () {
  const testLernSaxUser = {
    username: 'username',
    password: 'password'
  };

  it('should fail when input wrong user credentials', function () {
      this.timeout(5000);
      var loginService = new LernsaxLoginStrategy();
      return loginService.login(testLernSaxUser).then((err) => {
        chai.expect(err.message).to.equal('NotAuthenticated: No password set');
      });
  });
});
