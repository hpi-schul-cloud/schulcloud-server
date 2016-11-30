'use strict';

const service = require('feathers-mongoose');
const ltiTool = require('./model');
const hooks = require('./hooks');

module.exports = function() {
  const app = this;

  const LtiToolsService = require('./service')(app);


    const options = {
    Model: ltiTool,
    paginate: {
      default: 100,
      max: 100
    }
  };

  // Initialize our service with any options it requires
  app.use('/ltiTools', service(options));
  app.use('/ltiTools/connect', new LtiToolsService());

  // Get our initialize service to that we can bind hooks
  const ltiToolService = app.service('/ltiTools');

  // Set up our before hooks
  ltiToolService.before(hooks.before);

  // Set up our after hooks
  ltiToolService.after(hooks.after);
};
