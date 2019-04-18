const service = require('feathers-mongoose');
const role = require('./model');
const hooks = require('./hooks');

module.exports = function setup() {
    const app = this;

    const options = {
        Model: role,
        paginate: {
            default: 10,
            max: 25,
        },
        lean: true,
    };

    app.use('/roles', service(options));
    const roleService = app.service('/roles');
    roleService.hooks({
        before: hooks.before(),
        after: hooks.after,
    });
};
