const { userServiceV2, userServiceV2Hooks } = require('./user.service.v2');

module.exports = (app) => {
	app.use('users/v2/users/', userServiceV2);
	app.service('users/v2/users/').hooks(userServiceV2Hooks);
};
