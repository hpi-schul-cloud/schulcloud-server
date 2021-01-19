const assert = require('assert');
const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;

const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../src/app');

const { registrationPinModel } = require('../../../src/services/user/model');

const testObjects = require('../helpers/testObjects')(appPromise);

describe('registrationPin Service', () => {
	let app;
	let registrationPinService;
	let server;

	before(async () => {
		app = await appPromise;
		registrationPinService = app.service('registrationPins');
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
		await testObjects.cleanup();
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
		app = await appPromise;
		userService = app.service('users');
		publicTeachersService = app.service('publicTeachers');
		server = await app.listen(0);

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
		await server.close();
	});

	after(testObjects.cleanup);

	it('test if services registered', async () => {
		assert.ok(userService);
		assert.ok(publicTeachersService);
	});

	describe('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', () => {
		// save TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION value
		// eslint-disable-next-line max-len
		const ORIGINAL_TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION = Configuration.get(
			'TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION'
		);
		let result;

		it('set to opt-in: find 1 discoverable teacher (testTeacherEnabled) but not find other teachers', async () => {
			Configuration.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'opt-in');
			expect(Configuration.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('opt-in');
			result = await publicTeachersService.find({ query: { schoolId }, ...params });
			expect(result.total).to.equal(1);
			expect(result.data[0]._id.toString()).to.equal(testTeacherEnabled._id.toString());
			expect(result.data[0]._id.toString()).to.not.equal(testStudent._id.toString());
			expect(result.data[0]._id.toString()).to.not.equal(testTeacher._id.toString());
		});

		it('set to opt-out: find discoverable teachers but not find the disabled teacher', async () => {
			Configuration.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'opt-out');
			expect(Configuration.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('opt-out');
			result = await publicTeachersService.find({ query: { schoolId }, ...params });
			const resultIds = result.data.map((teacher) => teacher._id.toString());
			expect(resultIds).to.include(testTeacher._id.toString());
			expect(resultIds).to.include(testTeacherEnabled._id.toString());
			expect(resultIds).to.not.include(testTeacherDisabled._id.toString());
		});

		it('set to enabled: find all 2 teachers, ignoring their setting', async () => {
			// test with enabled'
			Configuration.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'enabled');
			expect(Configuration.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('enabled');
			result = await publicTeachersService.find({ query: { schoolId }, ...params });
			expect(result.total).to.equal(3);
			const resultIds = result.data.map((teacher) => teacher._id.toString());
			expect(resultIds).to.include(testTeacher._id.toString());
			expect(resultIds).to.include(testTeacherEnabled._id.toString());
			expect(resultIds).to.include(testTeacherDisabled._id.toString());
			expect(resultIds).to.not.include(testStudent._id.toString());
		});

		it('set to disabled: find no teachers (from different school), ignoring their setting', async () => {
			Configuration.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'disabled');
			expect(Configuration.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('disabled');
			expect(() => publicTeachersService.find({ query: { schoolId }, ...params })).to.throw;
			result = await publicTeachersService.find({
				query: { schoolId: teacherFromDifferentSchool.schoolId },
				...params,
			});
			expect(result.total).to.equal(1);
		});
		// reset TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION back to original value
		// eslint-disable-next-line max-len
		Configuration.set(
			'TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION',
			ORIGINAL_TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION
		);
	});

	after(async () => {
		await testObjects.cleanup();
	});
});
