/* eslint-disable object-curly-newline */
/* eslint-disable object-property-newline */
const { userModel, registrationPinModel } = require('./user/model');
const { teamsModel, permissionSchema, teamInvitedUserModel, teamUserModel } = require('./teams/model');

module.exports = {
	userModel, registrationPinModel,
	teamsModel, permissionSchema, teamInvitedUserModel, teamUserModel,
};
