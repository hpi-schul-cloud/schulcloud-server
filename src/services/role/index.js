const { configure } = require('./services/rolesService');
const { configure: configureRoleByName } = require('./services/permissionsByNameServices');


module.exports = (app) => {
	configure(app, { prepared: true });
	configureRoleByName(app);
};
