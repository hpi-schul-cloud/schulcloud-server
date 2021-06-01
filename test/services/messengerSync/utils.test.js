const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);
const {
	buildAddUserMessage,
	buildDeleteCourseMessage,
	buildDeleteTeamMessage,
	expandContentIds,
	messengerIsActivatedForSchool,
} = require('../../../src/services/messengerSync/utils');

describe('messenger synchronizer utils', () => {
	let app;
	let server;
	let configBefore;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		configBefore = Configuration.toObject({ plainSecrets: true });

		Configuration.set('MATRIX_MESSENGER__SECRET', 'fake.secret');
		Configuration.set('MATRIX_MESSENGER__SERVERNAME', 'fake.server');
	});

	after(async () => {
		await testObjects.cleanup();
		Configuration.reset(configBefore);
		await server.close();
	});

	/*
	{
		"method": "adduser",
		"welcome": {
			"text": "Welcome to messenger"
		},
		"user": {
			"id": "@sso_0000d224816abba584714c9c:matrix.server.com",
			"name": "Marla Mathe",
			"email": "(optional)",
			"password": "(optional)"
		},
		"rooms": [
			{
			"type": "(optional, default: room)",
			"id": "0000dcfbfb5c7a3f00bf21ab",
			"name": "Mathe",
			"description": "Kurs",
			"bidirectional": false,
			"is_moderator": false
			}
		]
	}

	{
		"method": "removeRoom",
		"room": {
			"type": "(optional, default: 'room')",
			"id": "Ab01234"
		}
	}
	*/

	describe('buildAddUserMessage', () => {
		it('builds a correct object for teacher with course', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger', 'messengerSchoolRoom'] });
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });
			const course = await testObjects.createTestCourse({ teacherIds: [teacher._id], schoolId: school._id });
			const result = await buildAddUserMessage({ userId: teacher._id, courses: [course] });

			// method
			expect(result.method).to.equal('addUser');

			// user
			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');

			// message
			expect(result).not.to.haveOwnProperty('welcome');

			// rooms
			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(3);
			const room = result.rooms[0];
			expect(room.id).to.equal(course._id.toString());
			expect(room.type).to.equal('course');
			expect(room.bidirectional).to.equal(false);
			expect(room.is_moderator).to.equal(true);
			expect(room).to.haveOwnProperty('name');

			const newsRoom = result.rooms[1];
			expect(newsRoom.id).to.equal(school._id.toString());
			expect(newsRoom.type).to.equal('news');
			expect(newsRoom.bidirectional).to.equal(false);
			expect(newsRoom.is_moderator).to.equal(true);
			expect(newsRoom).to.haveOwnProperty('name');

			const teachersRoom = result.rooms[2];
			expect(teachersRoom.id).to.equal(school._id.toString());
			expect(teachersRoom.type).to.equal('teachers');
			expect(teachersRoom.bidirectional).to.equal(true);
			expect(teachersRoom.is_moderator).to.equal(false);
			expect(teachersRoom).to.haveOwnProperty('name');
		});

		it('builds a correct object for teacher with team', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger', 'messengerSchoolRoom'] });
			const { user, team } = await testObjects.createTestTeamWithOwner({ roles: ['teacher'], schoolId: school._id });
			const result = await buildAddUserMessage({ userId: user._id, teams: [team] });
			expect(result.method).to.equal('addUser');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');

			expect(result).not.to.haveOwnProperty('welcome');

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(3);
			const room = result.rooms[0];
			expect(room.id).to.equal(team._id.toString());
			expect(room.type).to.equal('team');
			expect(room.bidirectional).to.equal(false);
			expect(room.is_moderator).to.equal(true);
			expect(room).to.haveOwnProperty('name');

			const newsRoom = result.rooms[1];
			expect(newsRoom.id).to.equal(school._id.toString());
			expect(newsRoom.type).to.equal('news');
			expect(newsRoom.bidirectional).to.equal(false);
			expect(newsRoom.is_moderator).to.equal(true);
			expect(newsRoom).to.haveOwnProperty('name');

			const teachersRoom = result.rooms[2];
			expect(teachersRoom.id).to.equal(school._id.toString());
			expect(teachersRoom.type).to.equal('teachers');
			expect(teachersRoom.bidirectional).to.equal(true);
			expect(teachersRoom.is_moderator).to.equal(false);
			expect(teachersRoom).to.haveOwnProperty('name');
		});

		it('builds a correct object for schoolSync with allhands disabled', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const { user } = await testObjects.createTestTeamWithOwner({ roles: ['teacher'], schoolId: school._id });
			await Promise.all([
				testObjects.createTestCourse({ teacherIds: [user._id], schoolId: school._id }),
				testObjects.createTestCourse({ teacherIds: [user._id], schoolId: school._id }),
			]);
			const result = await buildAddUserMessage({ userId: user._id, fullSync: true });
			expect(result.method).to.equal('addUser');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(4);

			expect(result.rooms[0].type).to.equal('course');
			expect(result.rooms[1].type).to.equal('course');
			expect(result.rooms[2].type).to.equal('team');

			const teachersRoom = result.rooms[3];
			expect(teachersRoom.id).to.equal(school._id.toString());
			expect(teachersRoom.type).to.equal('teachers');
			expect(teachersRoom.bidirectional).to.equal(true);
			expect(teachersRoom.is_moderator).to.equal(false);
			expect(teachersRoom).to.haveOwnProperty('name');
		});

		it('builds a correct object for admin without course or team', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const result = await buildAddUserMessage({ userId: admin._id, fullSync: true });
			expect(result.method).to.equal('addUser');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');

			expect(result).not.to.haveOwnProperty('welcome');

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(1);

			const teachersRoom = result.rooms[0];
			expect(teachersRoom.id).to.equal(school._id.toString());
			expect(teachersRoom.type).to.equal('teachers');
			expect(teachersRoom.bidirectional).to.equal(true);
			expect(teachersRoom.is_moderator).to.equal(true);
			expect(teachersRoom).to.haveOwnProperty('name');
		});

		it('builds a correct object for student with courses', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });

			await Promise.all([
				testObjects.createTestCourse({ userIds: [student._id], schoolId: school._id }),
				testObjects.createTestCourse({ userIds: [student._id], schoolId: school._id }),
			]);

			const result = await buildAddUserMessage({ userId: student._id, fullSync: true });
			expect(result.method).to.equal('addUser');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(2);

			expect(result.rooms[0].type).to.equal('course');
			expect(result.rooms[1].type).to.equal('course');
		});

		it('builds a correct object for student with write access in course', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });

			const courseProps = { userIds: [student._id], schoolId: school._id, features: ['messenger'] };
			const course = await testObjects.createTestCourse(courseProps);

			const result = await buildAddUserMessage({ userId: student._id, fullSync: true });
			expect(result.method).to.equal('addUser');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(1);
			const room = result.rooms[0];
			expect(room.id).to.equal(course._id.toString());
			expect(room.type).to.equal('course');
			expect(room.bidirectional).to.equal(true);
			expect(room.is_moderator).to.equal(false);
			expect(room).to.haveOwnProperty('name');
		});

		it('builds correct welcome messages', async () => {
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });
			const { user } = await testObjects.createTestTeamWithOwner({ roles: ['teacher'], schoolId: school._id });

			// only student message
			const studentWelcomeMessage = 'Welcome Student';
			Configuration.set('MATRIX_MESSENGER__WELCOME_MESSAGE_STUDENT', studentWelcomeMessage);

			const resultStudent1 = await buildAddUserMessage({ userId: student._id, fullSync: true });
			expect(resultStudent1.welcome.text).to.equal(studentWelcomeMessage);

			const resultTeacher1 = await buildAddUserMessage({ userId: user._id, fullSync: true });
			expect(resultTeacher1.welcome.text).to.equal(studentWelcomeMessage);

			const resultAdmin1 = await buildAddUserMessage({ userId: admin._id, fullSync: true });
			expect(resultAdmin1.welcome.text).to.equal(studentWelcomeMessage);

			// with teacher message
			const teacherWelcomeMessage = 'Welcome Teacher';
			Configuration.set('MATRIX_MESSENGER__WELCOME_MESSAGE_TEACHER', teacherWelcomeMessage);

			const resultStudent2 = await buildAddUserMessage({ userId: student._id, fullSync: true });
			expect(resultStudent2.welcome.text).to.equal(studentWelcomeMessage);

			const resultTeacher2 = await buildAddUserMessage({ userId: user._id, fullSync: true });
			expect(resultTeacher2.welcome.text).to.equal(teacherWelcomeMessage);

			const resultAdmin2 = await buildAddUserMessage({ userId: admin._id, fullSync: true });
			expect(resultAdmin2.welcome.text).to.equal(studentWelcomeMessage);

			// with admin message
			const adminWelcomeMessage = 'Welcome Admin';
			Configuration.set('MATRIX_MESSENGER__WELCOME_MESSAGE_ADMIN', adminWelcomeMessage);

			const resultStudent3 = await buildAddUserMessage({ userId: student._id, fullSync: true });
			expect(resultStudent3.welcome.text).to.equal(studentWelcomeMessage);

			const resultTeacher3 = await buildAddUserMessage({ userId: user._id, fullSync: true });
			expect(resultTeacher3.welcome.text).to.equal(teacherWelcomeMessage);

			const resultAdmin3 = await buildAddUserMessage({ userId: admin._id, fullSync: true });
			expect(resultAdmin3.welcome.text).to.equal(adminWelcomeMessage);

			// only admin message
			Configuration.remove('MATRIX_MESSENGER__WELCOME_MESSAGE_STUDENT');
			Configuration.remove('MATRIX_MESSENGER__WELCOME_MESSAGE_TEACHER');

			const resultStudent4 = await buildAddUserMessage({ userId: student._id, fullSync: true });
			expect(resultStudent4).not.to.haveOwnProperty('welcome');

			const resultTeacher4 = await buildAddUserMessage({ userId: user._id, fullSync: true });
			expect(resultTeacher4).not.to.haveOwnProperty('welcome');

			const resultAdmin4 = await buildAddUserMessage({ userId: admin._id, fullSync: true });
			expect(resultAdmin4.welcome.text).to.equal(adminWelcomeMessage);
		});
	});

	describe('buildDeleteCourseMessage', () => {
		it('builds a correct object', async () => {
			const result = await buildDeleteCourseMessage({ courseId: 'someCourse' });
			expect(result.method).to.equal('removeRoom');
			expect(result.room.type).to.equal('course');
			expect(result.room.id).to.equal('someCourse');
		});
	});

	describe('buildDeleteTeamMessage', () => {
		it('builds a correct object', async () => {
			const result = await buildDeleteTeamMessage({ teamId: 'someTeam' });
			expect(result.method).to.equal('removeRoom');
			expect(result.room.type).to.equal('team');
			expect(result.room.id).to.equal('someTeam');
		});
	});

	describe('messengerIsActivatedForSchool', () => {
		it('true if messenger flag is set', async () => {
			// arrange
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });

			// act
			const data = await expandContentIds({ userId: user._id });
			const result = messengerIsActivatedForSchool(data.school);

			// assert
			expect(result).to.equal(true);
		});

		it('false if messenger flag is not set', async () => {
			// arrange
			this.app = app;
			const school = await testObjects.createTestSchool({});
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });

			// act
			const data = await expandContentIds({ userId: user._id });
			const result = messengerIsActivatedForSchool(data.school);

			// assert
			expect(result).to.equal(false);
		});

		it('true if messenger flag is set on school sync', async () => {
			// arrange
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });

			// act
			const data = await expandContentIds({ schoolId: school._id });
			const result = messengerIsActivatedForSchool(data.school);

			// assert
			expect(result).to.equal(true);
		});

		it('false if messenger flag is not set on school sync', async () => {
			// arrange
			this.app = app;
			const school = await testObjects.createTestSchool({ features: [] });

			// act
			const data = await expandContentIds({ schoolId: school._id });
			const result = messengerIsActivatedForSchool(data.school);

			// assert
			expect(result).to.equal(false);
		});
	});
});
