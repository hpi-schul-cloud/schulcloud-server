const { UserServiceV2, adminHookGenerator } = require('./user.service.v2');

module.exports = (app) => {
	const adminStudentsRoute = '/users/v2/admin/student';
	app.use(adminStudentsRoute, new UserServiceV2('student'));
	app.service(adminStudentsRoute).hooks(adminHookGenerator('STUDENT'));

	const adminTeachersRoute = '/users/v2/admin/teacher';
	app.use(adminTeachersRoute, new UserServiceV2('teacher'));
	app.service(adminTeachersRoute).hooks(adminHookGenerator('TEACHER'));
};
