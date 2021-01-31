const createService = require('feathers-mongoose');
const hooks = require('./years.hooks');
const { yearModel: Model } = require('./years.model');

module.exports = (app) => {
    const servicePath = '/years';

    const paginate = {
        default: 500,
        max: 5000,
    };

    app.use(servicePath, createService({ Model, paginate }));

    const service = app.service(servicePath);
    service.hooks(hooks);
};