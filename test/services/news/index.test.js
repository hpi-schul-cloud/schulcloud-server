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
	createTestUser,
	createTestRole,
	createTestSchool,
} = require('../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);
const teamHelper = require('../helpers/services/teams');
const {
	newsModel: News,
	newsHistoryModel: NewsHistory,
} = require('../../../src/services/news/model');

const newsService = app.service('news');

describe('news service', () => {
	it('registers correctly', () => {
		expect(app.service('news')).to.not.equal(undefined);
	});

	describe('integration tests', function integrationTests() {
		this.timeout(5000);
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
				const school = await createTestSchool();
				const user = await createTestUser({ schoolId: school._id, roles: 'student' });
				const schoolNews = await News.create({
					schoolId: school._id,
					creatorId: user._id,
					title: 'knightly news',
					content: 'ni ni ni ni ni ni',
				});
				const params = await generateRequestParamsFromUser(user);
				const result = await newsService.get(schoolNews._id, params);
				expect(result._id.toString()).to.equal(schoolNews._id.toString());
				expect(result.title).to.equal(schoolNews.title);
				expect(result.content).that.equal(schoolNews.content);
			});

			it('should work for team news of teams the user is in, even from other schools', async () => {
				const schoolId = (await createTestSchool())._id;
				const school2Id = (await createTestSchool())._id;
				const teams = teamHelper(app, { schoolId });
				const user = await createTestUser({ schoolId, roles: 'administrator' });
				const user2 = await createTestUser({ schoolId: school2Id, roles: 'teacher' });
				const team = await teams.create(user2);
				await teams.addTeamUserToTeam(team._id, user, 'teammember');
				const news = await News.create({
					schoolId,
					creatorId: user._id,
					title: 'team news',
					content: 'content for my friends',
					target: team._id,
					targetModel: 'teams',
				});
				const params = await generateRequestParamsFromUser(user);
				const result = await newsService.get(news._id, params);
				expect(result).to.not.equal(undefined);
				expect(result._id.toString()).to.equal(news._id.toString());
			});

			it('should not return news if the user does not have the NEWS_VIEW permission', async () => {
				const schoolId = (await createTestSchool())._id;
				// the user has no role and thus no permissions:
				const user = await createTestUser({ schoolId });
				const schoolNews = await News.create({
					creatorId: user._id,
					schoolId,
					title: 'bridge news',
					content: 'What is thy name? What is thy task? What is thy favourite colour?',
				});
				expect(user.roles.length).to.equal(0);
				const params = await generateRequestParamsFromUser(user);
				try {
					await newsService.get(schoolNews._id, params);
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				}
			});

			it('should not return news items from a different school', async () => {
				const schoolId = (await createTestSchool())._id;
				const otherSchoolId = (await createTestSchool())._id;
				const schoolNews = await News.create({
					creatorId: (await createTestUser())._id,
					schoolId,
					title: 'French news',
					content: 'obtenir la vache!',
				});
				const user = await createTestUser({ schoolId: otherSchoolId, roles: 'student' });
				const params = await generateRequestParamsFromUser(user);
				try {
					await newsService.get(schoolNews._id, params);
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				}
			});

			it('should respond with an error if no news exist for the given id', async () => {
				const schoolId = (await createTestSchool())._id;
				const user = await createTestUser({ schoolId, roles: 'student' });
				const params = await generateRequestParamsFromUser(user);
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
				const schoolId = (await createTestSchool())._id;
				await News.create([
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'school A news',
						content: 'this is the content',
					},
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'school A news (2)',
						content: 'even more content',
					},
					{
						schoolId: (await createTestSchool())._id,
						creatorId: (await createTestUser())._id,
						title: 'school B news',
						content: 'we have content, too',
					},
				]);
				const user = await createTestUser({ schoolId, roles: 'student' }); // user is student at school A
				const params = await generateRequestParamsFromUser(user);
				const result = await newsService.find(params);
				expect(result.total).to.equal(2);
				expect(result.data.every(item => item.title.includes('school A news'))).to.equal(true);
			});

			it('should not return any news items if the user has no NEWS_VIEW permission', async () => {
				const schoolId = (await createTestSchool())._id;
				await News.create([
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'school A news',
						content: 'this is the content',
					},
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'school A news (2)',
						content: 'even more content',
					},
					{
						schoolId: (await createTestSchool())._id,
						creatorId: (await createTestUser())._id,
						title: 'school B news',
						content: 'we have content, too',
					},
				]);
				const user = await createTestUser({ schoolId }); // user is at school A, but has no role
				const params = await generateRequestParamsFromUser(user);
				const result = await newsService.find(params);
				expect(result.total).to.equal(0);
			});

			it('should return team news of teams the user is in', async () => {
				const schoolId = (await createTestSchool())._id;
				const teams = teamHelper(app, { schoolId });
				const user = await createTestUser({ schoolId, roles: 'administrator' });
				const user2 = await createTestUser({ schoolId, roles: 'teacher' });
				const teamA = await teams.create(user);
				const teamB = await teams.create(user2);
				await News.create([
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'school news',
						content: 'this is the content',
					},
					{
						schoolId,
						creatorId: user._id,
						title: 'team A news',
						content: 'even more content',
						target: teamA._id,
						targetModel: 'teams',
					},
					{
						schoolId: (await createTestSchool())._id, // team news created at another school
						creatorId: (await createTestUser())._id,
						title: 'team A news 2',
						content: 'even more content',
						target: teamA._id,
						targetModel: 'teams',
					},
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'team B news',
						content: 'we have content, too',
						target: teamB._id,
						targetModel: 'teams',
					},
				]);
				const params = await generateRequestParamsFromUser(user);
				const result = await newsService.find(params);
				expect(result.total).to.equal(3);
				expect(result.data.some(item => item.title === 'school news')).to.equal(true);
				expect(result.data.some(item => item.title === 'team A news')).to.equal(true);
				expect(result.data.some(item => item.title === 'team A news 2')).to.equal(true);
			});

			it('should return team news of non-school teams the user is in', async () => {
				const teamSchoolId = (await createTestSchool())._id;
				const schoolId = (await createTestSchool())._id;
				const teams = teamHelper(app, { schoolId: teamSchoolId });
				const user = await createTestUser({ schoolId, roles: 'administrator' });
				const user2 = await createTestUser({ schoolId: teamSchoolId, roles: 'teacher' });
				const team = await teams.create(user2);
				await teams.addTeamUserToTeam(team._id, user, 'teammember');
				await News.create([
					{
						schoolId: teamSchoolId,
						creatorId: (await createTestUser())._id,
						title: 'school news',
						content: 'this is the content',
					},
					{
						schoolId: teamSchoolId,
						creatorId: (await createTestUser())._id,
						title: 'team news',
						content: 'even more content',
						target: team._id,
						targetModel: 'teams',
					},
					{
						schoolId: (await createTestSchool())._id, // team news created at a third school
						creatorId: (await createTestUser())._id,
						title: 'team news 2',
						content: 'even more content',
						target: team._id,
						targetModel: 'teams',
					},
				]);
				const params = await generateRequestParamsFromUser(user);
				const result = await newsService.find(params);
				expect(result.total).to.equal(2);
				expect(result.data.some(item => item.title === 'school news')).to.equal(false);
				expect(result.data.some(item => item.title === 'team news')).to.equal(true);
				expect(result.data.some(item => item.title === 'team news 2')).to.equal(true);
			});

			it('should not return team news if the user has no NEWS_VIEW permission inside the team', async () => {
				const schoolId = (await createTestSchool())._id;
				const teams = teamHelper(app, { schoolId });
				const user = await createTestUser({ schoolId, roles: 'student' });
				const user2 = await createTestUser({ schoolId, roles: 'teacher' });
				const team = await teams.create(user2);
				await createTestRole({ name: 'teamuser', permissions: [] });
				await teams.addTeamUserToTeam(team._id, user, 'teamuser');
				await News.create([
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'team A news',
						content: 'even more content',
						target: team._id,
						targetModel: 'teams',
					},
				]);
				const params = await generateRequestParamsFromUser(user);
				const result = await newsService.find(params);
				expect(result.total).to.equal(0);
			});

			it('should paginate by default, but accept $paginate=false as query parameter', async () => {
				const schoolId = (await createTestSchool())._id;
				await News.create([
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'school news',
						content: 'this is the content',
					},
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'school news (2)',
						content: 'even more content',
					},
				]);
				const user = await createTestUser({ schoolId, roles: 'student' });
				const params = await generateRequestParamsFromUser(user);

				// default: $paginate=true
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
				const schoolId = (await createTestSchool())._id;
				await News.create([
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: '1',
						content: 'this is the content',
					},
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: '3',
						content: 'even more content',
					},
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: '2',
						content: 'content galore',
					},
				]);
				const user = await createTestUser({ schoolId, roles: 'student' });
				const params = await generateRequestParamsFromUser(user);
				params.query = { sort: '-title' };
				const result = await newsService.find(params);
				expect(result.total).to.equal(3);
				expect(result.data[0].title).to.equal('3');
				expect(result.data[1].title).to.equal('2');
				expect(result.data[2].title).to.equal('1');
			});

			it('should be able to sort by date', async () => {
				const schoolId = (await createTestSchool())._id;
				const creatorId = (await createTestUser())._id;
				await News.create([
					{
						schoolId,
						creatorId,
						title: '1',
						content: 'this is the content',
						createdAt: new Date('2019/06/02'),
					},
					{
						schoolId,
						creatorId,
						title: '2',
						content: 'even more content',
						createdAt: new Date('2019/05/30'),
					},
					{
						schoolId,
						creatorId,
						title: '3',
						content: 'content galore',
						createdAt: new Date('2019/06/03'),
					},
				]);
				const user = await createTestUser({ schoolId, roles: 'student' });
				const params = await generateRequestParamsFromUser(user);
				params.query = { sort: 'createdAt' };
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
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const params = await generateRequestParamsFromUser(user);
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
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'student' }); // student lacks the permission
				const params = await generateRequestParamsFromUser(user);
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
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const teams = teamHelper(app, { schoolId });
				const team = await teams.create(user);
				const params = await generateRequestParamsFromUser(user);
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
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const user2 = await createTestUser({ schoolId, roles: 'student' });
				const teams = teamHelper(app, { schoolId });
				const team = await teams.create(user2);
				const params = await generateRequestParamsFromUser(user);
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

			it('should set the creatorId to the creating user\'s id', async () => {
				const schoolId = (await createTestSchool())._id;
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const params = await generateRequestParamsFromUser(user);
				const result = await newsService.create({
					schoolId,
					title: 'school news',
					content: 'foo bar baz',
				}, params);
				expect(result).to.not.equal(undefined);
				expect(result.creatorId.toString()).to.equal(user._id.toString());
			});

			it('should not allow seting someone else as creator', async () => {
				const schoolId = (await createTestSchool())._id;
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const params = await generateRequestParamsFromUser(user);
				const result = await newsService.create({
					schoolId,
					creatorId: (await createTestUser())._id,
					title: 'school news',
					content: 'foo bar baz',
				}, params);
				expect(result).to.not.equal(undefined);
				expect(result.creatorId.toString()).to.equal(user._id.toString());
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
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const news = await News.create({
					title: 'Old news',
					content: 'Please delete',
					schoolId,
					creatorId: (await createTestUser())._id,
				});
				expect(await News.count({ schoolId })).to.equal(1);
				const params = await generateRequestParamsFromUser(user);
				await newsService.remove(news._id, params);
				expect(await News.count({ schoolId })).to.equal(0);
			});

			it('should not allow news deletion if the permission NEWS_CREATE is not set', async () => {
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'student' }); // student lacks the permission
				const news = await News.create({
					title: 'Old news',
					content: 'Please delete',
					schoolId,
					creatorId: (await createTestUser())._id,
				});
				expect(await News.count({ schoolId })).to.equal(1);
				const params = await generateRequestParamsFromUser(user);
				try {
					await newsService.remove(news._id, params);
					expect.fail('The previous call should have failed.');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				} finally {
					expect(await News.count({ schoolId })).to.equal(1);
				}
			});

			it('should enable deleting news in scopes the user has the necessary permissions in', async () => {
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const teams = teamHelper(app, { schoolId });
				const team = await teams.create(user);
				const teamNews = await News.create([
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'team news 1',
						content: 'this is the content',
						target: team._id,
						targetModel: 'teams',
					},
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'team news 2',
						content: 'this is the content',
						target: team._id,
						targetModel: 'teams',
					},
				]);
				expect(await News.count({ schoolId })).to.equal(2);
				const params = await generateRequestParamsFromUser(user);
				await newsService.remove(teamNews[0]._id, params);
				expect(await News.count({ schoolId })).to.equal(1);
			});

			it('should not allow creating news in other scopes', async () => {
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const user2 = await createTestUser({ schoolId, roles: 'student' });
				const teams = teamHelper(app, { schoolId });
				const team = await teams.create(user2);
				const teamNews = await News.create([
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'team news 1',
						content: 'this is the content',
						target: team._id,
						targetModel: 'teams',
					},
					{
						schoolId,
						creatorId: (await createTestUser())._id,
						title: 'team news 2',
						content: 'this is the content',
						target: team._id,
						targetModel: 'teams',
					},
				]);
				const params = await generateRequestParamsFromUser(user);
				try {
					await newsService.remove(teamNews[0]._id, params);
					expect.fail('The previous call should have failed.');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				} finally {
					expect(await News.count({ schoolId })).to.equal(2);
				}
			});

			after(async () => {
				await cleanup();
				await News.deleteMany({});
				await NewsHistory.deleteMany({});
			});
		});

		describe('PATCH', () => {
			it('should not work without authentication', async () => {
				// external request
				try {
					await newsService.patch(new ObjectId(), { foo: 'bar' }, { provider: 'rest' });
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(NotAuthenticated);
				}

				// internal request
				try {
					await newsService.patch(new ObjectId(), { foo: 'bar' });
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(BadRequest);
					expect(err.message).that.equal('Authentication is required.');
				}
			});

			it('should enable to patch news items at the user\'s school', async () => {
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const params = await generateRequestParamsFromUser(user);
				const news = await News.create({
					title: 'school news',
					content: 'some content',
					schoolId,
					creatorId: (await createTestUser())._id,
				});
				const patchedNews = await newsService.patch(news._id, { title: 'patched!' }, params);
				expect(patchedNews).to.not.equal(undefined);
				expect(patchedNews._id.toString()).to.equal(news._id.toString());
				expect(patchedNews.title).to.equal('patched!');
				expect(await News.count({ schoolId })).to.equal(1);
				expect(await News.findOne({ title: 'patched!' })).to.not.equal(undefined);
			});

			it('should not allow patching news if the permission NEWS_EDIT is not set', async () => {
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'student' }); // student lacks the permission
				const params = await generateRequestParamsFromUser(user);
				const news = await News.create({
					title: 'school news',
					content: 'some content',
					schoolId,
					creatorId: (await createTestUser())._id,
				});
				try {
					await newsService.patch(
						news._id,
						{
							schoolId,
							title: 'patched school news',
							content: 'foo bar baz',
						},
						params,
					);
					expect.fail('The previous call should have failed.');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				} finally {
					expect(await News.count({ schoolId })).to.equal(1);
					expect(await News.count({ title: 'school news' })).to.equal(1);
					expect(await News.count({ title: 'patched school news' })).to.equal(0);
				}
			});

			it('should enable patching news in scopes the user has the necessary permissions in', async () => {
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'student' });
				const teams = teamHelper(app, { schoolId });
				const team = await teams.create(user);
				const params = await generateRequestParamsFromUser(user);
				const news = await News.create({
					schoolId,
					creatorId: (await createTestUser())._id,
					title: 'school news',
					content: 'foo bar baz',
					target: team._id,
					targetModel: 'teams',
				});
				const result = await newsService.patch(news._id, { content: 'patched content' }, params);
				expect(result).to.not.equal(undefined);
				expect(result._id.toString()).to.equal(news._id.toString());
				expect(await News.count({ schoolId })).to.equal(1);
				expect(await News.count({ content: 'patched content' })).to.equal(1);
			});

			it('should not allow patching news in other scopes', async () => {
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const user2 = await createTestUser({ schoolId, roles: 'student' });
				const teams = teamHelper(app, { schoolId });
				const team = await teams.create(user2);
				const params = await generateRequestParamsFromUser(user);
				const news = await News.create({
					schoolId,
					creatorId: user2._id,
					title: 'school news',
					content: 'foo bar baz',
					target: team._id,
					targetModel: 'teams',
				});
				try {
					await newsService.patch(news._id, { content: 'patched content in other scope' }, params);
					expect.fail('The previous call should have failed.');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				} finally {
					expect(await News.count({ schoolId })).to.equal(1);
					expect(await News.count({ content: 'patched content in other scope' })).to.equal(0);
				}
			});

			it('should set the updaterId to the patching user\'s id', async () => {
				const schoolId = (await createTestSchool())._id;
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const params = await generateRequestParamsFromUser(user);
				const news = await News.create({
					title: 'school news',
					content: 'some content',
					schoolId,
					creatorId: (await createTestUser())._id,
				});
				const patchedNews = await newsService.patch(news._id, { title: 'patched!' }, params);
				expect(patchedNews).to.not.equal(undefined);
				expect(patchedNews.updaterId).to.not.equal(undefined);
				expect(patchedNews.updaterId.toString()).to.equal(user._id.toString());
				expect(patchedNews.updater.firstName).to.equal(user.firstName);
				expect(patchedNews.updater.lastName).to.equal(user.lastName);
				expect(patchedNews.creatorId.toString()).to.equal(news.creatorId.toString());
			});

			it.skip('should not allow patching the creatorId', async () => {
				// skip until immutable is implemented
				const schoolId = (await createTestSchool())._id;
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const params = await generateRequestParamsFromUser(user);
				const news = await News.create({
					title: 'school news',
					content: 'some content',
					schoolId,
					creatorId: (await createTestUser())._id,
				});
				const patchedNews = await newsService.patch(news._id, {
					title: 'patched!',
					creatorId: user._id,
				}, params);
				expect(patchedNews).to.not.equal(undefined);
				expect(patchedNews.updaterId).to.not.equal(undefined);
				expect(patchedNews.updaterId.toString()).to.equal(user._id.toString());
				expect(patchedNews.creatorId.toString()).to.equal(news.creatorId.toString());
			});

			after(async () => {
				await cleanup();
				await News.deleteMany({});
				await NewsHistory.deleteMany({});
			});
		});

		describe('UPDATE', () => {
			it('should not work without authentication', async () => {
				// external request
				try {
					await newsService.update(new ObjectId(), { foo: 'bar' }, { provider: 'rest' });
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(NotAuthenticated);
				}

				// internal request
				try {
					await newsService.update(new ObjectId(), { foo: 'bar' });
					expect.fail('The previous call should have failed');
				} catch (err) {
					expect(err).to.be.instanceOf(BadRequest);
					expect(err.message).that.equal('Authentication is required.');
				}
			});

			it('should enable to update news items at the user\'s school', async () => {
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const params = await generateRequestParamsFromUser(user);
				const news = await News.create({
					title: 'school news',
					content: 'some content',
					schoolId,
					creatorId: (await createTestUser())._id,
				});
				const updatedNews = await newsService.patch(news._id, {
					title: 'updated!', content: news.content, schoolId,
				}, params);
				expect(updatedNews).to.not.equal(undefined);
				expect(updatedNews._id.toString()).to.equal(news._id.toString());
				expect(updatedNews.title).to.equal('updated!');
				expect(await News.count({ schoolId })).to.equal(1);
				expect(await News.findOne({ title: 'updated!' })).to.not.equal(undefined);
			});

			it('should not allow updating news if the permission NEWS_EDIT is not set', async () => {
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'student' }); // student lacks the permission
				const params = await generateRequestParamsFromUser(user);
				const news = await News.create({
					title: 'school news',
					content: 'some content',
					schoolId,
					creatorId: user._id,
				});
				try {
					await newsService.update(
						news._id,
						{
							schoolId,
							title: 'updated school news',
							content: 'foo bar baz',
						},
						params,
					);
					expect.fail('The previous call should have failed.');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				} finally {
					expect(await News.count({ schoolId })).to.equal(1);
					expect(await News.count({ title: 'school news' })).to.equal(1);
					expect(await News.count({ title: 'updated school news' })).to.equal(0);
				}
			});

			it('should enable updating news in scopes the user has the necessary permissions in', async () => {
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'student' });
				const teams = teamHelper(app, { schoolId });
				const team = await teams.create(user);
				const params = await generateRequestParamsFromUser(user);
				const news = await News.create({
					schoolId,
					creatorId: (await createTestUser())._id,
					title: 'school news',
					content: 'foo bar baz',
					target: team._id,
					targetModel: 'teams',
				});
				const result = await newsService.update(news._id, {
					content: 'updated content', title: news.title, schoolId, creatorId: news.creatorId,
				}, params);
				expect(result).to.not.equal(undefined);
				expect(result._id.toString()).to.equal(news._id.toString());
				expect(await News.count({ schoolId })).to.equal(1);
				expect(await News.count({ content: 'updated content' })).to.equal(1);
			});

			it('should not allow patching news in other scopes', async () => {
				const schoolId = (await createTestSchool())._id;
				expect(await News.count({ schoolId })).to.equal(0);
				const user = await createTestUser({ schoolId, roles: 'teacher' });
				const user2 = await createTestUser({ schoolId, roles: 'student' });
				const teams = teamHelper(app, { schoolId });
				const team = await teams.create(user2);
				const params = await generateRequestParamsFromUser(user);
				const news = await News.create({
					schoolId,
					creatorId: user2._id,
					title: 'team-internal news',
					content: 'foo bar baz',
					target: team._id,
					targetModel: 'teams',
				});
				try {
					await newsService.update(news._id, {
						content: 'updated content in other scope', title: news.title, schoolId,
					}, params);
					expect.fail('The previous call should have failed.');
				} catch (err) {
					expect(err).to.be.instanceOf(Forbidden);
				} finally {
					expect(await News.count({ schoolId })).to.equal(1);
					expect(await News.count({ content: 'updated content in other scope' })).to.equal(0);
				}
			});

			after(async () => {
				await cleanup();
				await News.deleteMany({});
				await NewsHistory.deleteMany({});
			});
		});
	});

	describe('event handlers', () => {
		describe('team news', () => {
			it('is deleted after the coresponding team is deleted', async () => {
				const teamId = new ObjectId();
				const teamNews = await new News({
					schoolId: new ObjectId(),
					creatorId: new ObjectId(),
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
					creatorId: new ObjectId(),
					title: 'team news',
					content: 'here are some news concerning this team',
					target: teamId,
					targetModel: 'teams',
				}).save();
				const courseId = new ObjectId();
				const courseNews = await new News({
					schoolId,
					creatorId: new ObjectId(),
					title: 'course news',
					content: 'here are some news concerning this course',
					target: courseId,
					targetModel: 'courses',
				}).save();
				const schoolNews = await new News({
					schoolId,
					creatorId: new ObjectId(),
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
