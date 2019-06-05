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
const teamHelper = require('../helpers/services/teams');
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

		describe('GET', () => {
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

		describe('FIND', () => {
			it('should not work without authentication', async () => {
				// external request
				try {
					await newsService.find({ provider: 'rest' });
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(NotAuthenticated);
				}

				// internal request
				try {
					await newsService.find({});
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(BadRequest);
					expect(err.message).that.equal('Authentication is required.');
				}
			});

			it('should return all news items a user can see', async () => {
				const schoolId = new ObjectId();
				await News.create([
					{
						schoolId,
						title: 'school A news',
						content: 'this is the content',
					},
					{
						schoolId,
						title: 'school A news (2)',
						content: 'even more content',
					},
					{
						schoolId: new ObjectId(),
						title: 'school B news',
						content: 'we have content, too',
					},
				]);
				const user = await createTestUser({ schoolId, roles: 'student' }); // user is student at school A
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				const result = await newsService.find(params);
				expect(result.total).to.equal(2);
				expect(result.data.every(item => item.title.includes('school A news'))).to.equal(true);
			});

			it('should not return any news items if the user has no NEWS_VIEW permission', async () => {
				const schoolId = new ObjectId();
				await News.create([
					{
						schoolId,
						title: 'school A news',
						content: 'this is the content',
					},
					{
						schoolId,
						title: 'school A news (2)',
						content: 'even more content',
					},
					{
						schoolId: new ObjectId(),
						title: 'school B news',
						content: 'we have content, too',
					},
				]);
				const user = await createTestUser({ schoolId }); // user is at school A, but has no role
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				const result = await newsService.find(params);
				expect(result.total).to.equal(0);
			});

			it('should return team news of teams the user is in', async () => {
				const schoolId = new ObjectId();
				const teams = teamHelper(app, { schoolId });
				const user = await createTestUser({ schoolId, roles: 'administrator' });
				const user2 = await createTestUser({ schoolId, roles: 'teacher' });
				const teamA = await teams.create(user);
				const teamB = await teams.create(user2);
				await News.create([
					{
						schoolId,
						title: 'school news',
						content: 'this is the content',
					},
					{
						schoolId,
						title: 'team A news',
						content: 'even more content',
						target: teamA._id,
						targetModel: 'teams',
					},
					{
						schoolId,
						title: 'team B news',
						content: 'we have content, too',
						target: teamB._id,
						targetModel: 'teams',
					},
				]);
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				const result = await newsService.find(params);
				expect(result.total).to.equal(2);
				expect(result.data.some(item => item.title === 'school news')).to.equal(true);
				expect(result.data.some(item => item.title === 'team A news')).to.equal(true);
			});

			it('should not return team news if the user has no NEWS_VIEW permission inside the team', async () => {
				const schoolId = new ObjectId();
				const teams = teamHelper(app, { schoolId });
				const user = await createTestUser({ schoolId, roles: 'student' });
				const user2 = await createTestUser({ schoolId, roles: 'teacher' });
				const team = await teams.create(user2);
				teams.addTeamUserToTeam(team._id, user2, 'teamexpert'); // assuming the expert cannot see team news
				await News.create([
					{
						schoolId,
						title: 'team A news',
						content: 'even more content',
						target: team._id,
						targetModel: 'teams',
					},
				]);
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				const result = await newsService.find(params);
				expect(result.total).to.equal(0);
			});

			it('should paginate by default, but accept paginate=false as query parameter', async () => {
				const schoolId = new ObjectId();
				await News.create([
					{
						schoolId,
						title: 'school news',
						content: 'this is the content',
					},
					{
						schoolId,
						title: 'school news (2)',
						content: 'even more content',
					},
				]);
				const user = await createTestUser({ schoolId, roles: 'student' });
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);

				// default: paginate=true
				const paginatedResult = await newsService.find(params);
				expect(paginatedResult.total).to.equal(2);
				expect(paginatedResult.data.every(item => item.title.includes('school news'))).to.equal(true);

				// query param:
				params.query = { $paginate: false };
				const result = await newsService.find(params);
				expect(result).to.be.instanceOf(Array);
				expect(result.length).to.equal(2);
			});

			it('should handle sorting if requested', async () => {
				const schoolId = new ObjectId();
				await News.create([
					{
						schoolId,
						title: '1',
						content: 'this is the content',
					},
					{
						schoolId,
						title: '3',
						content: 'even more content',
					},
					{
						schoolId,
						title: '2',
						content: 'content galore',
					},
				]);
				const user = await createTestUser({ schoolId, roles: 'student' });
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				params.query = { $sort: { title: -1 } };
				const result = await newsService.find(params);
				expect(result.total).to.equal(3);
				expect(result.data[0].title).to.equal('3');
				expect(result.data[1].title).to.equal('2');
				expect(result.data[2].title).to.equal('1');
			});

			it('should be able to sort by date', async () => {
				const schoolId = new ObjectId();
				await News.create([
					{
						schoolId,
						title: '1',
						content: 'this is the content',
						createdAt: new Date('2019/06/02'),
					},
					{
						schoolId,
						title: '2',
						content: 'even more content',
						createdAt: new Date('2019/05/30'),
					},
					{
						schoolId,
						title: '3',
						content: 'content galore',
						createdAt: new Date('2019/06/03'),
					},
				]);
				const user = await createTestUser({ schoolId, roles: 'student' });
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				params.query = { $sort: { createdAt: 1 } };
				const result = await newsService.find(params);
				expect(result.total).to.equal(3);
				expect(result.data[0].title).to.equal('2');
				expect(result.data[1].title).to.equal('1');
				expect(result.data[2].title).to.equal('3');
			});

			after(async () => {
				await cleanup();
				await News.deleteMany({});
			});
		});

		describe('CREATE', () => {
			it('should not work without authentication', async () => {
				// external request
				try {
					await newsService.create({ foo: 'bar' }, { provider: 'rest' });
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(NotAuthenticated);
				}

				// internal request
				try {
					await newsService.create({ foo: 'bar' });
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(BadRequest);
					expect(err.message).that.equal('Authentication is required.');
				}
			});

			it('should enable to create news items at the user\'s school', async () => {
				const schoolId = new ObjectId();
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				const result = await newsService.create({
					schoolId,
					title: 'school news',
					content: 'foo bar baz',
				}, params);
				expect(result).to.not.equal(undefined);
				expect(result._id).to.not.equal(undefined);
				expect(await News.count({ schoolId })).to.equal(1);
			});

			it('should not allow news creation if the permission NEWS_CREATE is not set', async () => {
				const schoolId = new ObjectId();
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'student' }); // student lacks the permission
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				try {
					await newsService.create({
						schoolId,
						title: 'school news',
						content: 'foo bar baz',
					}, params);
					expect.fail('The previous call should have failed.');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				} finally {
					expect(await News.count({ schoolId })).to.equal(0);
				}
			});

			it('should enable creating news in scopes the user has the necessary permissions in', async () => {
				const schoolId = new ObjectId();
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const teams = teamHelper(app, { schoolId });
				const team = await teams.create(user);
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				const result = await newsService.create({
					schoolId,
					title: 'school news',
					content: 'foo bar baz',
					target: team._id,
					targetModel: 'teams',
				}, params);
				expect(result).to.not.equal(undefined);
				expect(result._id).to.not.equal(undefined);
				expect(await News.count({ schoolId })).to.equal(1);
			});

			it('should not allow creating news in other scopes', async () => {
				const schoolId = new ObjectId();
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const user2 = await createTestUser({ schoolId, roles: 'student' });
				const teams = teamHelper(app, { schoolId });
				const team = await teams.create(user2);
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				try {
					await newsService.create({
						schoolId,
						title: 'school news',
						content: 'foo bar baz',
						target: team._id,
						targetModel: 'teams',
					}, params);
					expect.fail('The previous call should have failed.');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				} finally {
					expect(await News.count({ schoolId })).to.equal(0);
				}
			});

			after(async () => {
				await cleanup();
				await News.deleteMany({});
			});
		});

		describe('DELETE', () => {
			it('should not work without authentication', async () => {
				// external request
				try {
					await newsService.remove(new ObjectId(), { provider: 'rest' });
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(NotAuthenticated);
				}

				// internal request
				try {
					await newsService.remove(new ObjectId());
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(BadRequest);
					expect(err.message).that.equal('Authentication is required.');
				}
			});

			it('should delete news items at the user\'s school', async () => {
				const schoolId = new ObjectId();
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const news = await News.create({
					title: 'Old news',
					content: 'Please delete',
					schoolId,
				});
				expect(await News.count({ schoolId })).to.equal(1);
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				await newsService.remove(news._id, params);
				expect(await News.count({ schoolId })).to.equal(0);
			});

			it('should not allow news deletion if the permission NEWS_CREATE is not set', async () => {
				const schoolId = new ObjectId();
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'student' }); // student lacks the permission
				const news = await News.create({
					title: 'Old news',
					content: 'Please delete',
					schoolId,
				});
				expect(await News.count({ schoolId })).to.equal(1);
				const credentials = { username: user.email, password: user.email };
				await createTestAccount(credentials, 'local', user);
				const params = await generateRequestParams(credentials);
				try {
					await newsService.remove(news._id, params);
					expect.fail('The previous call should have failed.');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				} finally {
					expect(await News.count({ schoolId })).to.equal(1);
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
