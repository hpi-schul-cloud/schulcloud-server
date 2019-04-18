const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const sleep = require('util').promisify(setTimeout);

const app = require('../../../src/app');
const News = require('../../../src/services/news/model').newsModel;
// testUser, testClass, testCourse anlegen:
const userService = app.service('users');
const classesService = app.service('classes');
const coursesService = app.service('courses');

describe.only('news service', () => {
	it('registers correctly', () => {
		expect(app.service('news')).to.not.equal(undefined);
	});

	describe('get route', () => {
		describe('School news', () => {
			it('returns news by school id', async () => {
				const schoolNews = await new News({
					schoolId: new ObjectId(),
					title: 'global school news',
					content: 'yo ho ho, and a bottle of rum',
				}).save();
				const newsService = app.service('news');
				const result = await newsService.get(schoolNews._id);
				expect(result.title).to.equal(schoolNews.title);

				// app.service('news').patch(dsada._id,{title:'bla'}) */
				describe('patch school news', () => {
					it('school news will be displayed correctly after patching', async () => {
						const schoolId = new ObjectId();
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
				// .remove(dsada._id) ??????

				describe('delete school news', () => {
					it('school news will not be displayed after deleting', async () => {
						//const schoolId = new ObjectId();
						const news = {
							title: 'lalala',
							content: '111test111',
							schoolId,
						};
						const schoolNews2 = await new News(news).save();
						expect(await News.findById(schoolNews2._id)).to.not.equal(null);
						const removedNews = await newsService.remove(schoolNews2._id);
						expect(await News.findById(schoolNews2._id)).to.equal(null);
					});
				});
			});


			// kann news patchen === bearbeiten

			// kann news löschen
			/*
		describe ('Team news', () => {
			it('returns news by teams id', async () => {
				const teamNews = await new News ({
					schoolId: new ObjectId(),
					title: 'global school news',
					content: 'yo ho ho, and a bottle of rum',
					targetModel: 'teams',
					target: '123',	
				})	
			})
		}) */
		});
	});


	// Sichtbarkeiten testen

	// Nutzer anlegen > einloggen 
	// Gar nicht nötig, stattdessen BeforeEach nutzen
	const createUserIds = [];
	function createTestUser({
		// required fields for user
		firstName = 'Max',
		lastName = 'Mustermann',
		email = `max${Date.now()}@mustermann.de`,
		schoolId = '584ad186816abba584714c94',
		accounts = [],
		roles = [],
		// manual cleanup, e.g. when testing delete:
		manualCleanup = false,
	} = {}) {
		return userService.create({
			firstName,
			lastName,
			email,
			schoolId,
			accounts,
			roles,
		})
			.then((user) => {
				if (!manualCleanup) {
					createdUserIds.push(user.id);
				}
				return user;
			});
	}
	// Class anlegen:
	const createdCourses = [];
	function createTestClass({
		// required fields
		name = 'testClass',
		schoolId = '584ad186816abba584714c94',
		userIds = [],
		teacherIds = [],
	}) {
		return classesService.create({
			// required fields for user
			name,
			schoolId,
			userIds,
			teacherIds,
		})
			.then((o) => {
				createdClasses.push(o.id);
				return o;
			});
	}
	// Kurse anlegen:

	function createTestCourse({
		// required fields for base group
		name = 'testCourse',
		schoolId = '584ad186816abba584714c94',
		userIds = [],
		classIds = [],
		teacherIds = [],
		ltiToolIds = [],
	}) {
		return coursesService.create({
			// required fields for user
			name,
			schoolId,
			userIds,
			classIds,
			teacherIds,
			ltiToolIds,
		})
			.then((o) => {
				createdCourses.push(o.id);
				return o;
			});
	}


	// Nutzer im Anschluss löschen after()

	function cleanup() {
		const userDeletions = createdUserIds.map(id => userService.remove(id));
		const classDeletions = createdClasses.map(id => classesService.remove(id));
		const courseDeletions = createdCourses.map(id => coursesService.remove(id));
		return Promise.all([]
			.concat(userDeletions)
			.concat(classDeletions)
			.concat(courseDeletions));
	}
	// Nutzer ist in school kann sehen


	// Nutzer ist in anderer Schule kann nicht sehen

	// Nutzer ist in Schule ist im Team und kann team news sehen 
	// Nutzer ist in Schule nicht im Team und kann die team news nicht sehen


	describe('event handlers', () => {
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
});