const { expect } = require('chai');
const assert = require('assert');

const { Configuration } = require('@hpi-schul-cloud/commons');
const { ENTITY_SOURCE, SOURCE_ID_ATTRIBUTE } = require('../../../../../src/services/sync/strategies/TSP/TSP');
const { TSPSchoolSyncer } = require('../../../../../src/services/sync/strategies/TSP/TSPSchoolSyncer');

describe('TSPSchoolSyncer', () => {
	const testSchoolId = '4f7c9da0-7f88-40d7-9669-833769950150';
	const testUserFirstName = 'James';
	const testUserLastName = 'Smith';

	const testTSPStudentUid = '2ed0f4d9-fcc7-4e27-ad7f-e3e92a23c97a';
	const testTSPStudentFirstName = 'John';
	const testTSPStudentLastName = 'Do';
	const testTSPStudent = {
		schuelerUid: testTSPStudentUid,
		schuelerVorname: testTSPStudentFirstName,
		schuelerNachname: testTSPStudentLastName,
	};

	const testTSPTeacherUid = '8835b6d7-c0a6-4c3d-b2f5-d342fdea0f93';
	const testTSPTeacherTitle = 'Dr.';
	const testTSPTeacherFirstName = 'Jane';
	const testTSPTeacherLastName = 'Doe';
	const testTSPTeacher = {
		lehrerUid: testTSPTeacherUid,
		lehrerTitel: testTSPTeacherTitle,
		lehrerVorname: testTSPTeacherFirstName,
		lehrerNachname: testTSPTeacherLastName,
	};

	const testApp = undefined;
	const testStats = undefined;
	const testLogger = undefined;
	const testConfig = undefined;

	let configBefore;

	beforeEach(() => {
		configBefore = Configuration.toObject({ plainSecrets: true });
	});

	afterEach(() => {
		Configuration.reset(configBefore);
	});

	describe('lastSyncedAtEnabled field should be set to', () => {
		it('true by default if the feature flag has not been set in the configuration', () => {
			const syncer = new TSPSchoolSyncer(testApp, testStats, testLogger, testConfig);

			expect(syncer.lastSyncedAtEnabled).to.equal(true);
		});

		it('true if the feature flag has been enabled in the configuration', () => {
			Configuration.set('FEATURE_SYNC_LAST_SYNCED_AT_ENABLED', true);

			const syncer = new TSPSchoolSyncer(testApp, testStats, testLogger, testConfig);

			expect(syncer.lastSyncedAtEnabled).to.equal(true);
		});

		it('false if the feature flag has been disabled in the configuration', () => {
			Configuration.set('FEATURE_SYNC_LAST_SYNCED_AT_ENABLED', false);

			const syncer = new TSPSchoolSyncer(testApp, testStats, testLogger, testConfig);

			expect(syncer.lastSyncedAtEnabled).to.equal(false);
		});
	});

	describe('prepareTeacherUpdateObject() method should return', () => {
		const setup = (lastSyncedAtEnabled, user) => {
			Configuration.set('FEATURE_SYNC_LAST_SYNCED_AT_ENABLED', lastSyncedAtEnabled);

			const syncer = new TSPSchoolSyncer(testApp, testStats, testLogger, testConfig);
			const teacherUpdateObject = syncer.prepareTeacherUpdateObject(user, testTSPTeacher);

			return { teacherUpdateObject };
		};

		it("an empty object if feature flag is disabled and nothing has changed in the teacher's data", () => {
			const { teacherUpdateObject } = setup(false, {
				namePrefix: testTSPTeacherTitle,
				firstName: testTSPTeacherFirstName,
				lastName: testTSPTeacherLastName,
			});

			assert.deepEqual(teacherUpdateObject, {});
		});

		it("valid object with just a valid lastSyncedAt field if feature flag is enabled and nothing has changed in the teacher's data", () => {
			const { teacherUpdateObject } = setup(true, {
				namePrefix: testTSPTeacherTitle,
				firstName: testTSPTeacherFirstName,
				lastName: testTSPTeacherLastName,
			});

			expect(teacherUpdateObject).to.not.contain.keys('namePrefix', 'firstName', 'lastName');
			expect(teacherUpdateObject.lastSyncedAt).to.not.equal(undefined);
			expect(teacherUpdateObject.lastSyncedAt).to.be.at.most(new Date());
		});

		describe("valid object with changed fields if anything has changed in the teacher's data", () => {
			it('and with valid lastSyncedAt field if feature flag is enabled', () => {
				const testTeacherTitle = 'D.Sc.';
				const { teacherUpdateObject } = setup(true, {
					namePrefix: testTeacherTitle,
					firstName: testUserFirstName,
					lastName: testUserLastName,
				});

				expect(teacherUpdateObject.namePrefix).to.equal(testTSPTeacherTitle);
				expect(teacherUpdateObject.firstName).to.equal(testTSPTeacherFirstName);
				expect(teacherUpdateObject.lastName).to.equal(testTSPTeacherLastName);
				expect(teacherUpdateObject.lastSyncedAt).to.not.equal(undefined);
				expect(teacherUpdateObject.lastSyncedAt).to.be.at.most(new Date());
			});

			it('but without lastSyncedAt field if feature flag is disabled', () => {
				const { teacherUpdateObject } = setup(false, {
					firstName: testUserFirstName,
					lastName: testUserLastName,
				});

				expect(teacherUpdateObject.namePrefix).to.equal(testTSPTeacherTitle);
				expect(teacherUpdateObject.firstName).to.equal(testTSPTeacherFirstName);
				expect(teacherUpdateObject.lastName).to.equal(testTSPTeacherLastName);
				expect(teacherUpdateObject).to.not.contain.keys('lastSyncedAt');
			});
		});
	});

	describe('prepareTeacherCreateObject() method should return valid object', () => {
		const setup = (lastSyncedAtEnabled) => {
			Configuration.set('FEATURE_SYNC_LAST_SYNCED_AT_ENABLED', lastSyncedAtEnabled);

			const syncer = new TSPSchoolSyncer(testApp, testStats, testLogger, testConfig);
			const teacherCreateObject = syncer.prepareTeacherCreateObject(testSchoolId, testTSPTeacher);

			return { teacherCreateObject };
		};

		const assertBaseFields = (teacherCreateObject) => {
			expect(teacherCreateObject.namePrefix).to.equal(testTSPTeacherTitle);
			expect(teacherCreateObject.firstName).to.equal(testTSPTeacherFirstName);
			expect(teacherCreateObject.lastName).to.equal(testTSPTeacherLastName);
			expect(teacherCreateObject.schoolId).to.equal(testSchoolId);
			expect(teacherCreateObject.source).to.equal(ENTITY_SOURCE);
			assert.deepEqual(teacherCreateObject.sourceOptions, { [SOURCE_ID_ATTRIBUTE]: testTSPTeacherUid });
		};

		it('with valid lastSyncedAt field value in case of enabled feature flag', () => {
			const { teacherCreateObject } = setup(true);

			assertBaseFields(teacherCreateObject);
			expect(teacherCreateObject.lastSyncedAt).to.not.equal(undefined);
			expect(teacherCreateObject.lastSyncedAt).to.be.at.most(new Date());
		});

		it('without lastSyncedAt field value in case of disabled feature flag', () => {
			const { teacherCreateObject } = setup(false);

			assertBaseFields(teacherCreateObject);
			expect(teacherCreateObject.lastSyncedAt).to.be.equal(undefined);
		});
	});

	describe('prepareStudentUpdateObject() method should return', () => {
		const setup = (lastSyncedAtEnabled, user) => {
			Configuration.set('FEATURE_SYNC_LAST_SYNCED_AT_ENABLED', lastSyncedAtEnabled);

			const syncer = new TSPSchoolSyncer(testApp, testStats, testLogger, testConfig);
			const studentUpdateObject = syncer.prepareStudentUpdateObject(user, testTSPStudent);

			return { studentUpdateObject };
		};

		it("an empty object if feature flag is disabled and nothing has changed in the student's data", () => {
			const { studentUpdateObject } = setup(false, {
				firstName: testTSPStudentFirstName,
				lastName: testTSPStudentLastName,
			});

			assert.deepEqual(studentUpdateObject, {});
		});

		it("valid object with just a valid lastSyncedAt field if feature flag is enabled and nothing has changed in the student's data", () => {
			const { studentUpdateObject } = setup(true, {
				firstName: testTSPStudentFirstName,
				lastName: testTSPStudentLastName,
			});

			expect(studentUpdateObject).to.not.contain.keys('firstName', 'lastName');
			expect(studentUpdateObject.lastSyncedAt).to.not.equal(undefined);
			expect(studentUpdateObject.lastSyncedAt).to.be.at.most(new Date());
		});

		describe("valid object with changed fields if anything has changed in the student's data", () => {
			it('and with valid lastSyncedAt field if feature flag is enabled', () => {
				const { studentUpdateObject } = setup(true, {
					firstName: testUserFirstName,
					lastName: testUserLastName,
				});

				expect(studentUpdateObject.firstName).to.equal(testTSPStudentFirstName);
				expect(studentUpdateObject.lastName).to.equal(testTSPStudentLastName);
				expect(studentUpdateObject.lastSyncedAt).to.not.equal(undefined);
				expect(studentUpdateObject.lastSyncedAt).to.be.at.most(new Date());
			});

			it('but without lastSyncedAt field if feature flag is disabled', () => {
				const { studentUpdateObject } = setup(false, {
					firstName: testUserFirstName,
					lastName: testUserLastName,
				});

				expect(studentUpdateObject.firstName).to.equal(testTSPStudentFirstName);
				expect(studentUpdateObject.lastName).to.equal(testTSPStudentLastName);
				expect(studentUpdateObject).to.not.contain.keys('lastSyncedAt');
			});
		});
	});

	describe('prepareStudentCreateObject() method should return valid object', () => {
		const setup = (lastSyncedAtEnabled) => {
			Configuration.set('FEATURE_SYNC_LAST_SYNCED_AT_ENABLED', lastSyncedAtEnabled);

			const syncer = new TSPSchoolSyncer(testApp, testStats, testLogger, testConfig);
			const studentCreateObject = syncer.prepareStudentCreateObject(testSchoolId, testTSPStudent);

			return { studentCreateObject };
		};

		const assertBaseFields = (studentCreateObject) => {
			expect(studentCreateObject.firstName).to.equal(testTSPStudentFirstName);
			expect(studentCreateObject.lastName).to.equal(testTSPStudentLastName);
			expect(studentCreateObject.schoolId).to.equal(testSchoolId);
			expect(studentCreateObject.source).to.equal(ENTITY_SOURCE);
			assert.deepEqual(studentCreateObject.sourceOptions, { [SOURCE_ID_ATTRIBUTE]: testTSPStudentUid });
		};

		it('with valid lastSyncedAt field value in case of enabled feature flag', () => {
			const { studentCreateObject } = setup(true);

			assertBaseFields(studentCreateObject);
			expect(studentCreateObject.lastSyncedAt).to.not.equal(undefined);
			expect(studentCreateObject.lastSyncedAt).to.be.at.most(new Date());
		});

		it('without lastSyncedAt field value in case of disabled feature flag', () => {
			const { studentCreateObject } = setup(false);

			assertBaseFields(studentCreateObject);
			expect(studentCreateObject).to.not.contain.keys('lastSyncedAt');
		});
	});
});
