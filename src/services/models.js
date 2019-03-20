/* eslint-disable object-curly-newline */
/* eslint-disable object-property-newline */
const { userModel, registrationPinModel } = require('./user/model');
const { teamsModel, permissionSchema, teamInvitedUserModel, teamUserModel } = require('./teams/model');
const { courseModel, courseGroupModel, classModel, gradeModel } = require('./user-group/model');

module.exports = {
	userModel, registrationPinModel,
	teamsModel, permissionSchema, teamInvitedUserModel, teamUserModel,
	courseModel, courseGroupModel, classModel, gradeModel,
};
