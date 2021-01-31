const createService = require('feathers-mongoose');
const hooks = require('./school-group.hooks');
const { schoolGroupModel: Model } = require('./school-group.model');

module.exports = (app) => {
    const servicePath = '/schoolGroup';

    const paginate = {
        default: 500,
        max: 5000,
    };

    app.use(servicePath, createService({ Model, paginate }));

    const service = app.service(servicePath);
    service.hooks(hooks);
};