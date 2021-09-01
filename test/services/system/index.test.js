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

	describe('FIND endpoint', () => {
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

		it('FIND passwords are not included in the response', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			});
			const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const result = await app.service('systems').find(params);
			expect(result.total).to.equal(1);
			expect(result.data[0].ldapConfig.searchUserPassword).to.be.undefined;
		});
	});

	describe('GET endpoint', () => {
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

		it('GET fails without sufficient permissions', async () => {
			const usersSystem = await testObjects.createTestSystem();
			const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const user = await testObjects.createTestUser({ roles: ['student'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			try {
				await app.service('systems').get(usersSystem._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: SYSTEM_EDIT.");
			}
		});
		it('GET passwords are not included in the response', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			});
			const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const result = await app.service('systems').get(usersSystem._id, params);
			expect(result.ldapConfig.searchUserPassword).to.be.undefined;
		});
	});

	describe('CREATE endpoint', async () => {
		it('CREATE fails without the right permissions', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const data = { type: 'ldap' };

			const user = await testObjects.createTestUser({ roles: ['student'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			try {
				await app.service('systems').create(data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: SYSTEM_CREATE.");
			}
		});

		it(
			'CREATE cannot create a system for a foreign school' /* , async () => {
			const usersSchool = await testObjects.createTestSchool();
			const otherSchool = await testObjects.createTestSchool();

			const data = { type: 'ldap' };

			const user = await testObjects.createTestUser({ roles: ['student'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			try {
				await app.service('systems').create(data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: SYSTEM_CREATE.");
			}
		} */
		);

		it('CREATE passwords are not included in the response', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const data = {
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			};

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const result = await app.service('systems').create(data, params);
			expect(result.ldapConfig.searchUserPassword).to.be.undefined;
		});

		// Cannot create another LDAP if you already have one?
	});

	describe('UPDATE endpoint', async () => {
		it('UPDATE fails without the right permissions', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			});
			const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const data = {
				type: 'ldap',
				url: 'http://someurl.com',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			};

			const user = await testObjects.createTestUser({ roles: ['student'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			try {
				await app.service('systems').update(usersSystem._id, data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: SYSTEM_EDIT.");
			}
		});
		it('UPDATE cannot edit a system for a foreign school', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			});
			const usersSchool = await testObjects.createTestSchool();
			await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const data = {
				type: 'ldap',
				url: 'http://someurl.com',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			};

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			try {
				await app.service('systems').update(usersSystem._id, data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('You are not allowed to access this system.');
			}
		});
		it('UPDATE passwords are not included in the response', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			});
			const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const data = {
				type: 'ldap',
				url: 'http://someurl.com',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			};

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const result = await app.service('systems').update(usersSystem._id, data, params);
			expect(result.ldapConfig.searchUserPassword).to.be.undefined;
		});
		it('UPDATE iServ configuration should not be editable', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
					provider: 'iserv-idm',
				},
			});
			const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const data = {
				type: 'ldap',
				url: 'http://someurl.com',
				ldapConfig: {
					searchUserPassword: 'somePassword',
					provider: 'iserv-idm',
				},
			};

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			try {
				await app.service('systems').update(usersSystem._id, data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('Not allowed to change this system');
			}
		});
	});

	describe('PATCH endpoint', async () => {
		it('PATCH fails without the right permissions', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			});
			const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const data = {
				url: 'http://someurl.com',
			};

			const user = await testObjects.createTestUser({ roles: ['student'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			try {
				await app.service('systems').patch(usersSystem._id, data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: SYSTEM_EDIT.");
			}
		});

		it('PATCH cannot patch a system for a foreign school', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			});
			const usersSchool = await testObjects.createTestSchool();
			await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const data = {
				url: 'http://someurl.com',
			};

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			try {
				await app.service('systems').patch(usersSystem._id, data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('You are not allowed to access this system.');
			}
		});
		it('PATCH passwords are not included in the response', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			});
			const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const data = {
				url: 'http://someurl.com',
			};

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const result = await app.service('systems').patch(usersSystem._id, data, params);
			expect(result.ldapConfig.searchUserPassword).to.be.undefined;
		});

		it('PATCH iServ configuration should not be editable', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
					provider: 'iserv-idm',
				},
			});
			const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const data = {
				url: 'http://someurl.com',
			};

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			try {
				await app.service('systems').patch(usersSystem._id, data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('Not allowed to change this system');
			}
		});
	});

	describe('REMOVE endpoint', async () => {
		it('REMOVE fails without the right permissions', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			});
			const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const user = await testObjects.createTestUser({ roles: ['student'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			try {
				await app.service('systems').remove(usersSystem._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: SYSTEM_CREATE.");
			}
		});

		it('REMOVE cannot remove a system for a foreign school', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			});
			const usersSchool = await testObjects.createTestSchool();
			await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			try {
				await app.service('systems').remove(usersSystem._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('You are not allowed to access this system.');
			}
		});
		it('REMOVE passwords are not included in the response', async () => {
			const usersSystem = await testObjects.createTestSystem({
				type: 'ldap',
				ldapConfig: {
					searchUserPassword: 'somePassword',
				},
			});
			const usersSchool = await testObjects.createTestSchool({ systems: [usersSystem._id] });

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: [usersSchool._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const result = await app.service('systems').remove(usersSystem._id, params);
			expect(result.ldapConfig.searchUserPassword).to.be.undefined;
		});
	});
});
