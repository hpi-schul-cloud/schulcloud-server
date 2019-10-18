const { expect } = require('chai');
const app = require('../../../src/app');

const { insightsIntegrationTest, insightsAverageTimeTest, objectKeys } = require('./helper');

const dauOverMauService = app.service('insights/dauOverMau');
const monthlyUsersService = app.service('insights/monthlyUsers');
const weeklyUsersService = app.service('insights/weeklyUsers');
const weeklyActivityService = app.service('insights/weeklyActivity');
const weeklyActiveUsersService = app.service('insights/weeklyActiveUsers');
const roleActivityService = app.service('insights/roleActivity');
const avgPageLoadedService = app.service('insights/avgPageLoaded');
const avgTimeToInteractiveService = app.service('insights/avgTimeToInteractive');
const uniquePageCountService = app.service('insights/uniquePageCount');

// todo, check with real school id to see different result
describe.only('insights service', () => {
	it('registers correctly', () => {
		expect(app.service('insights/dauOverMau')).to.not.equal(undefined);
		expect(app.service('insights/monthlyUsers')).to.not.equal(undefined);
		expect(app.service('insights/weeklyUsers')).to.not.equal(undefined);
		expect(app.service('insights/weeklyActivity')).to.not.equal(undefined);
		expect(app.service('insights/weeklyActiveUsers')).to.not.equal(undefined);
		expect(app.service('insights/roleActivity')).to.not.equal(undefined);
		expect(app.service('insights/avgPageLoaded')).to.not.equal(undefined);
		expect(app.service('insights/avgTimeToInteractive')).to.not.equal(undefined);
		expect(app.service('insights/uniquePageCount')).to.not.equal(undefined);
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

		insightsIntegrationTest('Dau Over Mau service', dauOverMauService, objectKeys.dauOverMau);
		insightsIntegrationTest('Monthly Users service', monthlyUsersService, objectKeys.monthlyUsers);
		insightsIntegrationTest('Weekly Users service', weeklyUsersService, objectKeys.weeklyUsersService);
		insightsIntegrationTest('Weekly Activity service', weeklyActivityService, objectKeys.weeklyActivityService);
		insightsIntegrationTest('Weekly Active Users service', weeklyActiveUsersService, objectKeys.weeklyActiveUsersService);
		insightsIntegrationTest('Role Activity service', roleActivityService, objectKeys.roleActivityService);
		insightsIntegrationTest('Avg Page Loaded service', avgPageLoadedService);
		insightsIntegrationTest('Avg Time To Interactive service', avgTimeToInteractiveService);
		insightsIntegrationTest('Unique Page Count service', uniquePageCountService);
	});
});
