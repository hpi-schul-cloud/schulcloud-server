const assert = require('assert');
const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;

const appPromise = require('../../../src/app');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');
const { registrationPinModel } = require('../../../src/services/user/model');

const testObjects = require('../helpers/testObjects')(appPromise());

describe('registrationPin Service', () => {
	let app;
	let registrationPinService;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		registrationPinService = app.service('registrationPins');
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await server.close();
		await testObjects.cleanup();
		await closeNestServices(nestServices);
	});

	let pin = null;
	const email = 'test.adresse@schul-cloud.org';
	it('registered the registrationPin Service', () => {
		assert.ok(registrationPinService);
	});

	it('creates pins correctly', () =>
		registrationPinService
			.create({ email, silent: true })
			.then(async () => {
				({ pin } = await registrationPinModel.findOne({ email }).exec());
			})
			.then(() => registrationPinService.find({ query: { email, pin } }))
			.then((pinObjects) => expect(pinObjects.data[0]).to.have.property('pin')));

	it('overwrites old pins', () =>
		registrationPinService
			.create({ email, silent: true })
			.then(async () => {
				const newPin = (await registrationPinModel.findOne({ email }).exec()).pin;
				expect(newPin).to.be.ok;
				expect(pin).to.be.not.equal(newPin);
				pin = newPin;
			})
			.then(() => registrationPinService.create({ email, silent: true }))
			.then(async () => {
				const newPin = (await registrationPinModel.findOne({ email }).exec()).pin;
				expect(newPin).to.be.ok;
				expect(pin).to.be.not.equal(newPin);
				pin = newPin;
			})
			.then(() => registrationPinService.find({ query: { email, pin } }))
			.then((pinObjects) => expect(pinObjects.data).to.have.lengthOf(1)));

	it('find without pin fails', () =>
		registrationPinService
			.create({ email, silent: true })
			.then(() => registrationPinService.create({ email, silent: true }))
			.then(() => registrationPinService.find({ query: { email } }))
			.then(() => {
				throw new Error('pin should be given');
			})
			.catch((err) => expect(err.message.length).to.be.greaterThan(5)));
});

describe('publicTeachers service', () => {
	let app;
	let nestServices;
	let userService;
	let publicTeachersService;

	let testStudent = {};
	let testTeacher = {};
	let testTeacherDisabled = {};
	let testTeacherEnabled = {};
	let teacherFromDifferentSchool;
	let params;
	let server;
	const schoolId = new ObjectId().toString();

	before(async () => {
		app = await appPromise();
		userService = app.service('users');
		publicTeachersService = app.service('publicTeachers');
		server = await app.listen(0);
		nestServices = await setupNestServices(app);

		testStudent = await testObjects.createTestUser({
			roles: ['student'],
			discoverable: false,
			schoolId,
			firstName: 'student',
		});
		testTeacher = await testObjects.createTestUser({
			roles: ['teacher'],
			// discoverable: undefined, // visibility depends on opt-in/opt-ut
			schoolId,
			firstName: 'teacher-default',
		});
		testTeacherDisabled = await testObjects.createTestUser({
			roles: ['teacher'],
			discoverable: false,
			schoolId,
			firstName: 'teacher-disabled',
		});
		testTeacherEnabled = await testObjects.createTestUser({
			roles: ['teacher'],
			discoverable: true,
			schoolId,
			firstName: 'teacher-enabled',
		});
		teacherFromDifferentSchool = await testObjects.createTestUser({
			schoolId: new ObjectId(),
			roles: ['teacher'],
			firstName: 'teacherFromdifferentSchool',
		});
		params = await testObjects.generateRequestParamsFromUser(teacherFromDifferentSchool);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	it('test if services registered', async () => {
		assert.ok(userService);
		assert.ok(publicTeachersService);
	});

	describe('teacher discoverability (opt-in)', () => {
		it('should find only the discoverable teacher of a foreign school', async () => {
			const result = await publicTeachersService.find({ query: { schoolId }, ...params });
			expect(result.total).to.equal(1);
			expect(result.data[0]._id.toString()).to.equal(testTeacherEnabled._id.toString());
		});

		it('should find teachers of the own school regardless of their setting', async () => {
			const result = await publicTeachersService.find({
				query: { schoolId: teacherFromDifferentSchool.schoolId },
				...params,
			});
			expect(result.total).to.equal(1);
		});
	});
});
