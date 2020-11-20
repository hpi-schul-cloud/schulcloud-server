const chai = require('chai');
const chaiHttp = require('chai-http');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { pseudonymRepo } = require('./index');

chai.use(chaiHttp);
const { expect } = chai;

describe('pseudonym repo', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	it('should return pseudonyms', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const ltiTool = await testObjects.createTestLtiTool();
		const pseudonym = await testObjects.createTestPseudonym({ pseudonym: 'PSEUDONYM' }, ltiTool, user);
		const pseudonyms = await pseudonymRepo.getPseudonyms(user._id, app);
		expect(pseudonyms[0]).to.deep.equal(pseudonym);
	});

	it('should delete pseudonyms', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const ltiTool = await testObjects.createTestLtiTool();
		const pseudonym = await testObjects.createTestPseudonym({ pseudonym: 'PSEUDONYM' }, ltiTool, user);
		let pseudonyms = await pseudonymRepo.getPseudonyms(user._id, app);
		expect(pseudonyms[0]).to.deep.equal(pseudonym);

		await pseudonymRepo.deletePseudonyms(pseudonyms, app);
		pseudonyms = await pseudonymRepo.getPseudonyms(user._id, app);
		expect(pseudonyms).to.have.length(0);
	});
});
