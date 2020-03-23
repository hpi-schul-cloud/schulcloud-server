const { configure } = require('./services/rolesService');


module.exports = (app) => {
	configure(app);
};
