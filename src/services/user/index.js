const service = require('feathers-mongoose');
const { userModel, registrationPinModel } = require('./model');
const hooks = require('./hooks');
const registrationPinsHooks = require('./hooks/registrationPins');
const publicTeachersHooks = require('./hooks/publicTeachers');
const firstLoginHooks = require('./hooks/firstLogin');
const skipRegistrationHooks = require('./hooks/skipRegistration');
const { AdminUsers, UserLinkImportService, SkipRegistrationService } = require('./services');
const adminHook = require('./hooks/admin');


module.exports = function setup() {
	const app = this;

	const options = {
		Model: userModel,
		paginate: {
			default: 1000,
			max: 1000,
		},
		lean: true,
	};

	app.use('/users', service(options));

	const userService = app.service('/users');
	app.use('users/linkImport', new UserLinkImportService(userService)); // do not use hooks

	userService.hooks(hooks); // TODO: refactor

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

	app.use('/users/:id/skipregistration', new SkipRegistrationService());
	const skipRegistrationService = app.service(adminStudentsRoute);
	skipRegistrationService.hooks(skipRegistrationHooks);
};
