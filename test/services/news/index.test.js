const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const sleep = require('util').promisify(setTimeout);

const app = require('../../../src/app');
const News = require('../../../src/services/news/model').newsModel;

const userService = app.service('users');
const classesService = app.service('classes');
const coursesService = app.service('courses');
// testUser, testClass, testCourse anlegen:
const User = require('../../../src/services/user/model').userModel;
const Class = require('../../../src/services/user-group/model').classModel;
// const Role = require('../../../src/services/role/model');
const School = require('../../../src/services/school/model').schoolModel;
const Course = require('../../../src/services/user-group/model').courseModel;
const Team = require('../../../src/services/teams/model').teamsModel;

const newsService = app.service('news');
const testObjects = require('../helpers/testObjects')(app);

const registrationPinService = app.service('registrationPins');

describe('news service', () => {
	it('registers correctly', () => {
		expect(app.service('news')).to.not.equal(undefined);
	});
	it('create news for own school', async () => {
		const school = await School.findOne({ name: 'Demo Schule' }).exec();
		const newsSchool = await newsService.create({
			title: 'test news school',
			content: '2111test111',
			schoolId: school._id,
		});
		expect(newsSchool).not.to.be.equal(null);
		const dbNews = await News.findById(newsSchool._id);
		expect(dbNews).not.to.be.eaqual(null);
	});
	it('create news for own class', async () => {
		const school = await School.findOne({ name: 'Demo Schule' }).exec();
		const testClass = await Class.findOne({ name: 'Demo-Klasse' }).exec();
		const newsClass = await newsService.create({
			title: 'class news',
			content: 'here is news for one class',
			schoolId: school._id,
			target: school._id,
			targetModel: 'school',
		});
		expect(newsClass).not.to.be.equal(null);
		const clNews = await News.findById(newsClass._id);
		expect(clNews).not.to.be.equal(null);
	});
	it('create news for own course', async () => {
		const school = await School.findOne({ name: 'Demo Schule' }).exec();
		const testCourse = await Course.findOne({ name: 'Mathe' }).exec();
		const newsCourse = await newsService.create({
			title: 'course news',
			content: 'here is news for one course',
			schoolId: school._id,
			targetModel: 'courses',
			target: testCourse._id,
		});
		expect(newsCourse).not.to.be.equal(null);
		const coNews = await News.findById(newsCourse._id);
		expect(coNews).not.to.be.equal(null);
	});
	it('create news for own team', async () => {
		const school = await School.findOne({ name: 'Demo Schule' }).exec();
		const testTeam = await new Team({
			name: 'testTeam',
			schoolId: school._id,
			userIds: [await new ObjectId(), await new ObjectId()],
		}).save;
		const newsTeam = await newsService.create({
			title: 'team news',
			content: 'here is news for one team',
			schoolId: school._id,
			target: testTeam._id,
			targetModel: 'teams',
		});
		expect(newsTeam).not.to.be.equal(null);
		const teNews = await News.findById(newsTeam._id);
		expect(teNews).not.to.be.equal(null);
	});

	describe('School news', () => {
		it('returns news by school id', async () => {
			const schoolNews = await new News({
				schoolId: new ObjectId(),
				title: 'global school news',
				content: 'yo ho ho, and a bottle of rum',
			}).save();
			const result = await newsService.get(schoolNews._id);
			expect(result.title).to.equal(schoolNews.title);
		});
	});

	describe('patch school news', () => {
		it('school news will be displayed correctly after patching', async () => {
			const schoolId = await new ObjectId();
			const schoolNews1 = await new News({
				title: 'lalala bla bla geändert',
				content: '111test111',
				target: schoolId,
			}).save();

			const newsId = schoolNews1._id;
			const newsService1 = app.service('news');
			const patchedNews = await newsService1.patch(newsId, { title: 'bla' });
			expect(patchedNews.title).to.equal(schoolNews1.title);
		});
	});

	describe('delete school news', () => {
		it('school news will not be displayed after deleting', async () => {
			const schoolId = await new ObjectId();
			const news = {
				title: 'lalala',
				content: '111test111',
				schoolId,
			};
			const schoolNews2 = await new News(news).save();
			expect(await News.findById(schoolNews2._id)).to.not.equal(null);
			// const removedNews = await newsService.remove(schoolNews2._id);
			expect(await News.findById(schoolNews2._id)).to.equal(null);
		});
	});
	describe.only('visibility', () => {
		it('create sample news of school news for school members', async () => {
			// Nutzer ist in class kann sehen
			const schoolId = await new ObjectId();
			const news = await new News({
				title: 'sample news',
				content: 'visibility test',
				schoolId,
				targetModel: 'class',
				// target: schoolId,
			}).save();
			const newsCount = await News.count({ _id: news._id });
			expect(newsCount).to.equal(1);
			// await News.remove({ _id: news._id });
			// expect(await News.find({ _id: news._id }).to.be(0));
		});
		it('of school news for non-school members', async () => {
			// Nutzer ist in anderer Klasse kann nicht sehen
			const schoolId = await new ObjectId();
			const classId = await new ObjectId();
			const news = await new News({
				title: 'sample news',
				content: 'visibility test',
				schoolId,
				target: classId,
				targetModel: 'class',
			}).save();
			const newsCount = await News.count({ _id: news._id });
			expect(newsCount).to.equal(1);
		});
		// Sichtbarkeiten testen
		it.only('create test user', async () => {
			const schoolId = await new ObjectId();
			// await testObjects.createTestUser({ schoolId });
			const newUser = await new User({
				firstName: 'Test',
				lastName: 'User',
				email: 'test@test.de',
				schoolId,
				role: 'teacher',
			}).save();
			const userId = newUser._id;
			const newTeam = await new Team({
				name: 'Test Sichtbarkeit',
				schoolId,
				userIds: [userId],
			}).save();
			const testNews = await new News({
				title: 'sample news',
				content: 'visibility test',
				schoolId,
				target: newTeam._id,
				targetModel: 'team',
			}).save();

		// await testObjects.createTestUser({ schoolId2 });
		// after(testObjects.cleanup);
		});
	});

	// Nutzer im Anschluss löschen after()
	// Nutzer ist in Schule ist im Team und kann team news sehen
	// Nutzer ist in Schule nicht im Team und kann die team news nicht sehen

	describe('team news', () => {
		it('is deleted after the coresponding team is deleted', async () => {
			const teamId = new ObjectId();
			const teamNews = await new News({
				schoolId: new ObjectId(),
				title: 'team news',
				content: 'here are some news concerning this team',
				target: teamId,
				targetModel: 'teams',
			}).save();
			expect(await News.count({ _id: teamNews._id })).to.equal(1);
			app.service('teams').emit('removed', { _id: teamId });
			await sleep(100); // give the event listener time to work
			expect(await News.count({ _id: teamNews._id })).to.equal(0);
		});
		it('does not delete any other news', async () => {
			const schoolId = new ObjectId();
			const teamId = new ObjectId();
			await new News({
				schoolId,
				title: 'team news',
				content: 'here are some news concerning this team',
				target: teamId,
				targetModel: 'teams',
			}).save();
			const courseId = new ObjectId();
			const courseNews = await new News({
				schoolId,
				title: 'course news',
				content: 'here are some news concerning this course',
				target: courseId,
				targetModel: 'courses',
			}).save();
			const schoolNews = await new News({
				schoolId,
				title: 'global school news',
				content: 'yo ho ho, and a bottle of rum',
			}).save();

			const newsCount = await News.count({ schoolId });
			expect(newsCount).to.equal(3);
			app.service('teams').emit('removed', { _id: teamId });
			await sleep(100); // give the event listener time to work
			const result = await News.count({ schoolId });
			expect(result).to.equal(2);
			await News.remove({
				_id: { $in: [courseNews._id, schoolNews._id] },
			});
		});
	});
});
