'use strict';

const ua = require('universal-analytics');
const hooks = require('./hooks');

const url = require('url');

class Service {

    constructor(options) {
        this.options = options || {};
        this.docs = {};

    }

    create(data, params) {
        let visitor = ua(data.tid);
        visitor.pageview(data).send();
        return Promise.resolve('send');
    }

    setup(app, path) {
        this.app = app;
    }

}

module.exports = function () {
    const app = this;

    // Initialize our service with any options it requires
    app.use('/statistics', new Service());

    // Get our initialize service to that we can bind hooks
    const contentService = app.service('/statistics');

    // Set up our before hooks
    contentService.before(hooks.before);

    // Set up our after hooks
    contentService.after(hooks.after);
};

module.exports.Service = Service;
