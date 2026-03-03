const { UserServiceV2, adminHookGenerator } = require('./user.service.v2');

module.exports = (app) => {
	const adminStudentsRoute = '/users/v2/admin/student';
	app.use(adminStudentsRoute, new UserServiceV2('STUDENT'));
	app.service(adminStudentsRoute).hooks(adminHookGenerator('STUDENT'));

	const adminTeachersRoute = '/users/v2/admin/teacher';
	app.use(adminTeachersRoute, new UserServiceV2('TEACHER'));
	app.service(adminTeachersRoute).hooks(adminHookGenerator('TEACHER'));

	const adminAdminsRoute = '/users/v2/admin/administrator';
	app.use(adminAdminsRoute, new UserServiceV2('ADMINISTRATOR'));
	app.service(adminAdminsRoute).hooks(adminHookGenerator());
};
