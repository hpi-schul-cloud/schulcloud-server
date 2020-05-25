const service = require('feathers-mongoose');
const { userModel, registrationPinModel } = require('./model');
const registrationPinsHooks = require('./hooks/registrationPins');
const publicTeachersHooks = require('./hooks/publicTeachers');
const firstLoginHooks = require('./hooks/firstLogin');
const { skipRegistrationSingleHooks, skipRegistrationBulkHooks } = require('./hooks/skipRegistration');
const {
	AdminUsers,
	UserLinkImportService,
	SkipRegistrationService,
	RegistrationSchoolService,
	UsersModelService,
	UserService,
	MailRegistrationLink,
} = require('./services');
const adminHook = require('./hooks/admin');


module.exports = (app) => {
	app.use('usersModel', UsersModelService.userModelService);
	app.service('usersModel').hooks(UsersModelService.userModelHooks);

	app.use('/users', UserService.userService);
	const userService = app.service('/users');
	userService.hooks(UserService.userHooks);

	app.use('users/linkImport', new UserLinkImportService(userService)); // do not use hooks

	/* publicTeachers Service */
	app.use('/publicTeachers', service({
		Model: userModel,
		paginate: {
			default: 25,
			max: 1000,
		},
		lean: true,
	}));

	const publicTeachersService = app.service('/publicTeachers');
	publicTeachersService.hooks(publicTeachersHooks);


	/* registrationPin Service */
	app.use('/registrationPins', service({
		Model: registrationPinModel,
		paginate: {
			default: 500,
			max: 5000,
		},
		lean: true,
	}));
	const registrationPinService = app.service('/registrationPins');
	registrationPinService.hooks(registrationPinsHooks);

	const RegistrationService = require('./registration')(app);
	app.use('/registration', new RegistrationService());

	const FirstLoginService = require('./firstLogin')(app);
	app.use('/firstLogin', new FirstLoginService());
	const firstLoginService = app.service('firstLogin');
	firstLoginService.hooks(firstLoginHooks);

	const adminStudentsRoute = '/users/admin/students';
	app.use(adminStudentsRoute, new AdminUsers('student'));
	const adminStudentsService = app.service(adminStudentsRoute);
	adminStudentsService.hooks(adminHook);

	const adminTeachersRoute = '/users/admin/teachers';
	app.use(adminTeachersRoute, new AdminUsers('teacher'));
	const adminTeachersService = app.service(adminTeachersRoute);
	adminTeachersService.hooks(adminHook);

	const RegistrationLinkRoute = '/users/mail/registrationLink';
	app.use(RegistrationLinkRoute, new MailRegistrationLink.Service());
	const RegistrationLinkService = app.service(RegistrationLinkRoute);
	RegistrationLinkService.hooks(MailRegistrationLink.Hooks);

	app.use('/users/:userId/skipregistration', new SkipRegistrationService());
	app.service('/users/:userId/skipregistration').hooks(skipRegistrationSingleHooks);
	app.use('/users/skipregistration', new SkipRegistrationService());
	app.service('/users/skipregistration').hooks(skipRegistrationBulkHooks);

	app.use('/registrationSchool', new RegistrationSchoolService());
};
