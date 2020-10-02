const { expect } = require('chai');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);
const { buildAddUserMessage, messengerIsActivatedForSchool } = require('../../../src/services/messengerSync/utils');

describe('messenger synchronizer utils', () => {
	let app;
	let server;
	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
		testObjects.cleanup();
	});

	/* {
	method: 'adduser',
    school:{
		id: 1223435,
		has_allhands_channel : true,
		name: "Peanuts High"
    },
    user: {
        id: 1234566@matrix.schul-cloud.org,
        name: "Joe Cool"",
		is_school_admin: true,
		is_school_teacher: true,
    },
    room: {
		id: 1234566,
		name: 'Mathe 6b',
		type: 'course',
		is_moderator: false,
		bidirectional: true
    }
} */

	describe('buildAddUserMessage', () => {
		it('builds a correct object for teacher with course', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger', 'messengerSchoolRoom'] });
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });
			const course = await testObjects.createTestCourse({ teacherIds: [teacher._id], schoolId: school._id });
			const result = await buildAddUserMessage({ userId: teacher._id, courses: [course] });
			expect(result.method).to.equal('adduser');

			expect(result.school.id).to.equal(school._id.toString());
			expect(result.school.has_allhands_channel).to.equal(true);
			expect(result.school).to.haveOwnProperty('name');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');
			expect(result.user.is_school_admin).to.equal(false);
			expect(result.user.is_school_teacher).to.equal(true);

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(1);
			const room = result.rooms[0];
			expect(room.id).to.equal(course._id.toString());
			expect(room.type).to.equal('course');
			expect(room.bidirectional).to.equal(false);
			expect(room.is_moderator).to.equal(true);
			expect(room).to.haveOwnProperty('name');
		});

		it('builds a correct object for teacher with team', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger', 'messengerSchoolRoom'] });
			const { user, team } = await testObjects.createTestTeamWithOwner({ roles: ['teacher'], schoolId: school._id });
			const result = await buildAddUserMessage({ userId: user._id, teams: [team] });
			expect(result.method).to.equal('adduser');

			expect(result.school.id).to.equal(school._id.toString());
			expect(result.school.has_allhands_channel).to.equal(true);
			expect(result.school).to.haveOwnProperty('name');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');
			expect(result.user.is_school_admin).to.equal(false);
			expect(result.user.is_school_teacher).to.equal(true);

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(1);
			const room = result.rooms[0];
			expect(room.id).to.equal(team._id.toString());
			expect(room.type).to.equal('team');
			expect(room.bidirectional).to.equal(false);
			expect(room.is_moderator).to.equal(true);
			expect(room).to.haveOwnProperty('name');
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
			expect(result.method).to.equal('adduser');

			expect(result.school.id).to.equal(school._id.toString());
			expect(result.school.has_allhands_channel).to.equal(false);
			expect(result.school).to.haveOwnProperty('name');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');
			expect(result.user.is_school_admin).to.equal(false);
			expect(result.user.is_school_teacher).to.equal(true);

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(3);
		});

		it('builds a correct object for admin without course or team', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const result = await buildAddUserMessage({ userId: admin._id, fullSync: true });
			expect(result.method).to.equal('adduser');

			expect(result.school.id).to.equal(school._id.toString());
			expect(result.school.has_allhands_channel).to.equal(false);
			expect(result.school).to.haveOwnProperty('name');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');
			expect(result.user.is_school_admin).to.equal(true);
			expect(result.user.is_school_teacher).to.equal(false);

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(0);
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
			expect(result.method).to.equal('adduser');

			expect(result.school.id).to.equal(school._id.toString());
			expect(result.school.has_allhands_channel).to.equal(false);
			expect(result.school).to.haveOwnProperty('name');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');
			expect(result.user.is_school_admin).to.equal(false);
			expect(result.user.is_school_teacher).to.equal(false);

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(2);
		});

		it('builds a correct object for student with write access in course', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });

			const courseProps = { userIds: [student._id], schoolId: school._id, features: ['messenger'] };
			const course = await testObjects.createTestCourse(courseProps);

			const result = await buildAddUserMessage({ userId: student._id, fullSync: true });
			expect(result.method).to.equal('adduser');

			expect(result.school.id).to.equal(school._id.toString());
			expect(result.school.has_allhands_channel).to.equal(false);
			expect(result.school).to.haveOwnProperty('name');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');
			expect(result.user.is_school_admin).to.equal(false);
			expect(result.user.is_school_teacher).to.equal(false);

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(1);
			const room = result.rooms[0];
			expect(room.id).to.equal(course._id.toString());
			expect(room.type).to.equal('course');
			expect(room.bidirectional).to.equal(true);
			expect(room.is_moderator).to.equal(false);
			expect(room).to.haveOwnProperty('name');
		});
	});

	describe('messengerIsActivatedForSchool', () => {
		it('true if messenger flag is set', async () => {
			// arrange
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });

			// act
			const result = await messengerIsActivatedForSchool({ userId: user._id });

			// assert
			expect(result).to.equal(true);
		});

		it('false if messenger flag is not set', async () => {
			// arrange
			this.app = app;
			const school = await testObjects.createTestSchool({});
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });

			// act
			const result = await messengerIsActivatedForSchool({ userId: user._id });

			// assert
			expect(result).to.equal(false);
		});

		it('true if messenger flag is set on school sync', async () => {
			// arrange
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });

			// act
			const result = await messengerIsActivatedForSchool({ schoolId: school._id });

			// assert
			expect(result).to.equal(true);
		});

		it('false if messenger flag is not set on school sync', async () => {
			// arrange
			this.app = app;
			const school = await testObjects.createTestSchool({ features: [] });

			// act
			const result = await messengerIsActivatedForSchool({ schoolId: school._id });

			// assert
			expect(result).to.equal(false);
		});
	});
});
