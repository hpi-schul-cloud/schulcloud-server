/**
* Created by niklas on 02/11/2016.
*/
'use strict';
const app = require('../../../app');
const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const request = require('request-promise');

const AbstractLoginStrategy = require('./interface.js');
const responseStatusCallbacks = {
  '401': {
    'message': 'Not authorized',
    'callback': () => {
      return Promise.reject(new errors.NotAuthenticated('No password set'));
    }
  },
  '200': {
    'message': 'Login success',
    'callback': (username, password) => {
      return Promise.resolve({
        success: true,
        username: username
      });
    }
  }
};

//const userService = app.service('/users');
const accountService = app.service('/accounts');

class LernsaxLoginStrategy extends AbstractLoginStrategy {

  // TODO: system isn't actually required, wait for a real test user from partnerschule
  login({username, password}, system) {
    const lernsaxOptions = {
      username: username,
      password: password,
      davUrl: 'https://$1:$2@lernsax.de/webdav.php'.replace('$1', username).replace('$2', password)
    };

    if (!lernsaxOptions.username) return Promise.reject('no username set');
		if (!lernsaxOptions.password) return Promise.reject(new errors.NotAuthenticated('No password set'));

    return request({
        url: lernsaxOptions.davUrl,
        method: 'Get',
        transform: (body, res) => {
          return responseStatusCallbacks[res.statusCode].callback();
        }
    }).then(function (response) {
        return response;
    })
    .catch(function (err) {
        return err;
    });

  }
}

module.exports = LernsaxLoginStrategy;
