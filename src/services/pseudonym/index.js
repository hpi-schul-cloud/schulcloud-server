'use strict';

const service = require('feathers-mongoose');
const Pseudonym = require('./model');
const hooks = require('./hooks');

module.exports = function() {
  const app = this;

  const options = {
    Model: Pseudonym,
    paginate: {
      default: 100,
      max: 100
    }
  };

  // Initialize our service with any options it requires
  app.use('/pseudonym', service(options));

  // Get our initialize service to that we can bind hooks
  const pseudoService = app.service('/pseudonym');

  // Set up our before hooks
  pseudoService.before(hooks.before);

  // Set up our after hooks
  pseudoService.after(hooks.after);
};
