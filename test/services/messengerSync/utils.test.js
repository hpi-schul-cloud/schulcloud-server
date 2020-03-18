const { expect } = require('chai');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { buildAddUserMessage } = require('../../../src/services/messengerSync/utils');

describe('messenger synchronizer utils', () => {
	let server;
	before((done) => {
		server = app.listen(0, done);
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
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
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
			expect(room.is_moderator).to.equal(true);
			expect(room).to.haveOwnProperty('bidirectional');
			expect(room).to.haveOwnProperty('name');
		});

		it('builds a correct object for teacher with team', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const { user, team } = await testObjects.createTestTeamWithOwner(
				{ roles: ['teacher'], schoolId: school._id },
			);
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
			expect(room.is_moderator).to.equal(true);
			expect(room).to.haveOwnProperty('bidirectional');
			expect(room).to.haveOwnProperty('name');
		});

		it('builds a correct object for schoolSync', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const { user, team } = await testObjects.createTestTeamWithOwner(
				{ roles: ['teacher'], schoolId: school._id },
			);
			const courses = await Promise.all([
				testObjects.createTestCourse({ teacherIds: [user._id], schoolId: school._id }),
				testObjects.createTestCourse({ teacherIds: [user._id], schoolId: school._id }),
			]);
			const result = await buildAddUserMessage({ userId: user._id, schoolSync: true });
			expect(result.method).to.equal('adduser');

			expect(result.school.id).to.equal(school._id.toString());
			expect(result.school.has_allhands_channel).to.equal(true);
			expect(result.school).to.haveOwnProperty('name');

			expect(result.user).to.haveOwnProperty('name');
			expect(result.user).to.haveOwnProperty('id');
			expect(result.user.is_school_admin).to.equal(false);
			expect(result.user.is_school_teacher).to.equal(true);

			expect(Array.isArray(result.rooms)).to.equal(true);
			expect(result.rooms.length).to.eq(3);
		});
	});
});
