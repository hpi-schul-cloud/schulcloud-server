const { configure } = require('./services/rolesService');
const { configure: configureRoleByName } = require('./services/permissionsByNameServices');


module.exports = (app) => {
	configure(app);
	configureRoleByName(app);
};
