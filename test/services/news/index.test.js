const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const sleep = require('util').promisify(setTimeout);
const {
	NotAuthenticated,
	BadRequest,
	Forbidden,
} = require('@feathersjs/errors');

const app = require('../../../src/app');
const {
	cleanup,
	createTestAccount,
	createTestUser,
	generateRequestParams,
} = require('../helpers/testObjects')(app);
const News = require('../../../src/services/news/model').newsModel;

const newsService = app.service('news');

describe('news service', () => {
	it('registers correctly', () => {
		expect(app.service('news')).to.not.equal(undefined);
	});

	describe('integration tests', () => {
		let server;

		before((done) => {
			server = app.listen(0, done);
		});

		after((done) => {
			server.close(done);
		});

		describe('GET route', () => {
			it('should not work without authentication', async () => {
				// external request
				try {
					await newsService.get(new ObjectId(), { provider: 'rest' });
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(NotAuthenticated);
				}

				// internal request
				try {
					await newsService.get(new ObjectId());
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(BadRequest);
					expect(err.message).that.equal('Authentication is required.');
				}
			});

			it('should return news items by id', async () => {
				const schoolId = new ObjectId();
				const schoolNews = await News.create({
					schoolId,
					title: 'knightly news',
					content: 'ni ni ni ni ni ni',
				});
				const user = await createTestUser({ schoolId, roles: 'student' });
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				const result = await newsService.get(schoolNews._id, params);
				expect(result._id.toString()).to.equal(schoolNews._id.toString());
				expect(result.title).to.equal(schoolNews.title);
				expect(result.content).that.equal(schoolNews.content);
			});

			it('should not return news if the user does not have the NEWS_VIEW permission', async () => {
				const schoolId = new ObjectId();
				const schoolNews = await News.create({
					schoolId,
					title: 'bridge news',
					content: 'What is thy name? What is thy task? What is thy favourite colour?',
				});
				// the user has no role and thus no permissions:
				const user = await createTestUser({ schoolId });
				expect(user.roles.length).to.equal(0);
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				try {
					await newsService.get(schoolNews._id, params);
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				}
			});

			it('should not return news items from a different school', async () => {
				const schoolId = new ObjectId();
				const otherSchoolId = new ObjectId();
				const schoolNews = await News.create({
					schoolId,
					title: 'French news',
					content: 'obtenir la vache!',
				});
				const user = await createTestUser({ schoolId: otherSchoolId, roles: 'student' });
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				try {
					await newsService.get(schoolNews._id, params);
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				}
			});

			it('should respond with an error if no news exist for the given id', async () => {
				const schoolId = new ObjectId();
				const user = await createTestUser({ schoolId, roles: 'student' });
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				try {
					await newsService.get(new ObjectId(), params);
					expect.fail('The previous call should have failed');
				} catch (err) {
					// The following should work, but doesn't:
					// expect(err).to.be.instanceOf(NotFound);
					// workaround:
					expect(err.name).that.equal('NotFound');
					expect(err.className).to.equal('not-found');
					expect(err.code).to.equal(404);
				}
			});

			after(async () => {
				await cleanup();
				await News.deleteMany({});
			});
		});
	});

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
