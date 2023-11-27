const { expect } = require('chai');
const { ScopeMembersService } = require('../../../../src/services/helpers/scopePermissions');

describe('ScopeMembersService', () => {
	it('should work', () => expect(ScopeMembersService).to.be.ok);

	describe('handler', () => {
		it('should accept and execute a well-defined handler function', async () => {
			const FIXTURE = '5434834634hdgfdghf_fixture';
			const SERVICE_PATH = '/soccerTeams/:scopeId/members';
			const MEMBERS = { 1: ['SOME', 'PERMISSIONS'], 2: ['OTHER', 'PERMISSIONS'] };
			let registeredService;
			const defaults = {
				hooks: () => true,
			};
			const fakeApp = {
				// eslint-disable-next-line no-return-assign
				use: (_path, service) => (registeredService = Object.assign(service, defaults)),
				service: (path) => (path === SERVICE_PATH ? registeredService : defaults),
			};
			const handler = (params) => {
				expect(params.fixx).to.equal(FIXTURE);
				return MEMBERS;
			};

			const membersService = ScopeMembersService.initialize(fakeApp, SERVICE_PATH, handler);

			try {
				const result = await membersService.find({ fixx: FIXTURE });
				expect(result).to.deep.equal(MEMBERS);
			} catch (err) {
				expect.fail(`No error should have been thrown. Got '${err}' instead.`);
			}
		});
	});
});
