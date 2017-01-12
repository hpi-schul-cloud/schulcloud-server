'use strict';

const service = require('feathers-mongoose');
const link = require('./link-model');
const hooks = require('./hooks');

module.exports = function() {
  const app = this;

  const options = {
    Model: link,
    paginate: {
      default: 5,
      max: 25
    }
  };

  // Initialize our service with any options it requires
  app.use('/links', service(options));

  // Get our initialize service to that we can bind hooks
  const linkService = app.service('/links');

  // Set up our before hooks
  linkService.before(hooks.before(linkService));

  // Set up our after hooks
  linkService.after(hooks.after);
};
