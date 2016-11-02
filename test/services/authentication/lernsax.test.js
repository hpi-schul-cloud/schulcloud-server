'use strict';

const chai = require('chai');
const assert = require('assert');
const promisify = require("es6-promisify");
const LernsaxLoginStrategy = require('../../../src/services/authentication/strategies/lernsax.js');
var should = chai.should();

describe('Lernsax single-sign-on', function () {
  const testLernSaxUserFail = {
    username: 'username',
    password: 'password'
  };

  const testLernSaxUser = {
    username: 'nils.karn@fmsh.lernsax.de',
    password: 'schul-cloud'
  };

  it('should succeed when input with correct credentials', function () {
      this.timeout(5000);
      var loginService = new LernsaxLoginStrategy();
      return loginService.login(testLernSaxUser).then((response) => {
        var _res = response.response;
        chai.expect(_res).to.be.not.undefined;
        chai.expect(_res.success).to.be.true;
        chai.expect(_res.username).to.equal(testLernSaxUser.username);
      });
  });

  it('should fail when input wrong user credentials', function () {
      this.timeout(5000);
      var loginService = new LernsaxLoginStrategy();
      return loginService.login(testLernSaxUserFail).then((err) => {
        chai.expect(err.message).to.equal('NotAuthenticated: wrong password');
      });
  });
});
