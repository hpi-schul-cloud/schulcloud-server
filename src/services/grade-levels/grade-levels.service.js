const createService = require('feathers-mongoose');
const hooks = require('./grade-levels.hooks');
const { gradeLevelModel: Model } = require('./grade-levels.model');

module.exports = (app) => {
    const servicePath = '/gradeLevels';

    const paginate = {
        default: 500,
        max: 5000,
    };

    app.use(servicePath, createService({ Model, paginate }));

    const service = app.service(servicePath);
    service.hooks(hooks);
};