const userServiceV2 = require('./user.service.v2');

module.exports = (app) => {
	const adminStudentsRoute = '/users/v2/admin/student';
	app.use(adminStudentsRoute, new userServiceV2.UserServiceV2('student'));
	app.service(adminStudentsRoute).hooks(userServiceV2.adminHookGenerator('STUDENT'));

	const adminTeachersRoute = '/users/v2/admin/teacher';
	app.use(adminTeachersRoute, new userServiceV2.UserServiceV2('teacher'));
	app.service(adminTeachersRoute).hooks(userServiceV2.adminHookGenerator('TEACHER'));
};
