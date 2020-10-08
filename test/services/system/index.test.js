const assert = require('assert');
const { expect } = require('chai');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);

describe('systemId service', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen();
	});

	after(async () => {
		await server.close();
	});

	it('registered the systems service', () => {
		assert.ok(app.service('systems'));
	});

	it('FIND only shows systems of the current school', async () => {
		const usersSystem = await testObjects.createTestSystem();
		const otherSystem = await testObjects.createTestSystem();
		const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });
		await testObjects.createTestSchool({ systems: [otherSystem._id] });

		const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
		const params = await testObjects.generateRequestParamsFromUser(user);

		const result = await app.service('systems').find(params);
		expect(result.total).to.equal(1);
		expect(result.data[0]._id.toString()).to.equal(usersSystem._id.toString());
	});

	it('FIND fails without proper permissions', async () => {
		const usersSystem = await testObjects.createTestSystem();
		const otherSystem = await testObjects.createTestSystem();
		const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });
		await testObjects.createTestSchool({ systems: [otherSystem._id] });

		const user = await testObjects.createTestUser({ roles: ['student'], schoolId: [usersSchool._id] });
		const params = await testObjects.generateRequestParamsFromUser(user);

		try {
			await app.service('systems').find(params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: SYSTEM_EDIT.");
		}
	});

	it('GET fails for different school', async () => {
		const otherSystem = await testObjects.createTestSystem();
		const usersSchool = await testObjects.createTestSchool({});
		await testObjects.createTestSchool({ systems: [otherSystem._id] });

		const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
		const params = await testObjects.generateRequestParamsFromUser(user);

		try {
			await app.service('systems').get(otherSystem._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('You are not allowed to access this system.');
		}
	});
});
