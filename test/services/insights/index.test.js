const { expect } = require('chai');
const app = require('../../../src/app');
/* const {
	NotAuthenticated,
	BadRequest,
	Forbidden,
} = require('@feathersjs/errors');
const { cleanup, createTestUser, testObjects } = require('../helpers/testObjects')(app);

const {
	createTestSchool,
} = require('../helpers/testObjects')(app);

const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);
 */
const { insightsTestingFunction, objectKeys } = require('./helper');

const dauOverMauService = app.service('insights/dauOverMau');
const monthlyUsersService = app.service('insights/monthlyUsers');
const weeklyUsersService = app.service('insights/weeklyUsers');
const weeklyActivityService = app.service('insights/weeklyActivity');
const weeklyActiveUsersService = app.service('insights/weeklyActiveUsers');
const roleActivityService = app.service('insights/roleActivity');


describe.only('insights service', () => {
	it('registers correctly', () => {
		expect(app.service('insights/dauOverMau')).to.not.equal(undefined);
		expect(app.service('insights/monthlyUsers')).to.not.equal(undefined);
		expect(app.service('insights/weeklyUsers')).to.not.equal(undefined);
		expect(app.service('insights/weeklyActivity')).to.not.equal(undefined);
		expect(app.service('insights/weeklyActiveUsers')).to.not.equal(undefined);
		expect(app.service('insights/roleActivity')).to.not.equal(undefined);
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

		insightsTestingFunction('Dau Over Mau service', dauOverMauService, objectKeys.dauOverMau);
		insightsTestingFunction('Monthly Users service', monthlyUsersService, objectKeys.monthlyUsers);
		insightsTestingFunction('Weekly Users service', weeklyUsersService, objectKeys.weeklyUsersService);
		insightsTestingFunction('Weekly Activity service', weeklyActivityService, objectKeys.weeklyActivityService);
		insightsTestingFunction(
			'Weekly Active Users service', weeklyActiveUsersService, objectKeys.weeklyActiveUsersService,
		);
		insightsTestingFunction('Role Activity service', roleActivityService, objectKeys.roleActivityService);
	});
});
