const sinon = require('sinon');

const app = require('../../src/app');
const { cleanup, createTestUser, createTestRole, createTestSchool } = require('../services/helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../services/helpers/services/login')(app);

describe.only('request context', function test() {
	this.timeout(500000);
	let server, school, user, userParams;

	before((done) => {
		sinon.stub(console, 'log');
		server = app.listen(0, done);
	});

	after(async () => {
		console.log.restore();
		await cleanup();
		return server.close();
	});

	it('measure request time using news', async () => {
		// 20 vs 17 seconds :( 15% decrease
		const newsService = app.service('news');
		school = await createTestSchool();
		user = await createTestUser({ schoolId: school._id, roles: 'teacher' });
		userParams = await generateRequestParamsFromUser(user);
		for (let i = 0; i < 1000; i++) {
			const schoolNews = await newsService.create(
				{
					schoolId: school._id,
					creatorId: user._id,
					title: 'knightly news',
					content: 'ni ni ni ni ni ni',
				},
				userParams
			);
		}
	});
});
