const hooks = require('feathers-hooks-common');
const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const reqlib = require('app-root-path').require;

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
	RegistrationConsentService,
	registrationConsentServiceHooks,
	ForcePasswordChange: { ForcePasswordChangeService, ForcePasswordChangeServiceHooks },
	QrRegistrationLinks: { QrRegistrationLinks, qrRegistrationLinksHooks },
} = require('./services');

const { registerApiValidation } = reqlib('src/utils/apiValidation');

module.exports = (app) => {
	registerApiValidation(app, path.join(__dirname, '/docs/adminusers.openapi.yaml'));

	app.use('usersModel', UsersModelService.userModelService);
	app.service('usersModel').hooks(UsersModelService.userModelHooks);

	app.use('/users', UserService.userService);
	const userService = app.service('/users');
	userService.hooks(UserService.userHooks);

	app.use('users/linkImport', new UserLinkImportService(userService)); // do not use hooks

	/* publicTeachers Service */
	app.use(
		'/publicTeachers',
		service({
			Model: userModel,
			paginate: {
				default: 25,
				max: 1000,
			},
			lean: true,
		})
	);

	const publicTeachersService = app.service('/publicTeachers');
	publicTeachersService.hooks(publicTeachersHooks);

	/* registrationPin Service */
	app.use(
		'/registrationPinsModel',
		service({
			Model: registrationPinModel,
			paginate: {
				default: 500,
				max: 5000,
			},
			lean: true,
		})
	);
	const registrationPinModelService = app.service('/registrationPinsModel');
	registrationPinModelService.hooks({
		before: { all: hooks.disallow('external') },
		after: {},
	});

	app.use(
		'/registrationPins',
		service({
			Model: registrationPinModel,
			paginate: {
				default: 500,
				max: 5000,
			},
			lean: true,
		})
	);
	const registrationPinService = app.service('/registrationPins');
	registrationPinService.hooks(registrationPinsHooks);

	const RegistrationService = require('./registration')(app);
	app.use('/registration', new RegistrationService());

	app.use('/registration/consent', new RegistrationConsentService());
	const registrationConsentService = app.service('/registration/consent');
	registrationConsentService.hooks(registrationConsentServiceHooks);

	app.use('/forcePasswordChange', new ForcePasswordChangeService());
	const forcePasswordChangeService = app.service('forcePasswordChange');
	forcePasswordChangeService.hooks(ForcePasswordChangeServiceHooks);

	const FirstLoginService = require('./firstLogin')(app);
	app.use('/firstLogin', new FirstLoginService());
	const firstLoginService = app.service('firstLogin');
	firstLoginService.hooks(firstLoginHooks);

	const adminStudentsRoute = '/users/admin/students';
	app.use(adminStudentsRoute, new AdminUsers.AdminUsers('student'));
	const adminStudentsService = app.service(adminStudentsRoute);
	adminStudentsService.hooks(AdminUsers.adminHookGenerator('STUDENT'));

	const adminTeachersRoute = '/users/admin/teachers';
	app.use(adminTeachersRoute, new AdminUsers.AdminUsers('teacher'));
	const adminTeachersService = app.service(adminTeachersRoute);
	adminTeachersService.hooks(AdminUsers.adminHookGenerator('TEACHER'));

	const RegistrationLinkRoute = '/users/mail/registrationLink';
	app.use(RegistrationLinkRoute, new MailRegistrationLink.Service());
	const RegistrationLinkService = app.service(RegistrationLinkRoute);
	RegistrationLinkService.hooks(MailRegistrationLink.Hooks);

	const qrRegistrationLinksRoute = '/users/qrRegistrationLink';
	app.use(qrRegistrationLinksRoute, new QrRegistrationLinks(userModel));
	const qrRegistrationLinksService = app.service(qrRegistrationLinksRoute);
	qrRegistrationLinksService.hooks(qrRegistrationLinksHooks);

	app.use('/users/:userId/skipregistration', new SkipRegistrationService());
	app.service('/users/:userId/skipregistration').hooks(skipRegistrationSingleHooks);
	app.use('/users/skipregistration', new SkipRegistrationService());
	app.service('/users/skipregistration').hooks(skipRegistrationBulkHooks);

	app.use('/registrationSchool', new RegistrationSchoolService());

	app.use('/users/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
};
