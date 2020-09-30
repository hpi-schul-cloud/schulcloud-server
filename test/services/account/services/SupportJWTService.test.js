const assert = require('assert');
const chai = require('chai');
const { decode } = require('jsonwebtoken');

const { expect } = chai;

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);


describe('supportJWTService', () => {
	let app;
	let supportJWTService;
	const testedPermission = 'CREATE_SUPPORT_JWT';

	let server;

	before(async () => {
		app = await appPromise;
		supportJWTService = app.service('accounts/supportJWT');
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('registered the supportJWT service', () => {
		assert.ok(supportJWTService);
	});

	it('accepts only POST/create requests', async () => {
		for (const method of ['create']) {
			expect(supportJWTService[method]).to.exist;
		}
		for (const method of ['get', 'update', 'patch', 'remove', 'find']) {
			expect(supportJWTService[method]).to.not.exist;
		}
	});

	it(`create with ${testedPermission} permission should work.`, async () => {
		const [superhero, student] = await Promise.all([
			testObjects.setupUser({ roles: 'superhero' }),
			testObjects.setupUser({ roles: 'student' }),
		]);

		const { roles } = await app.service('users').get(superhero.userId, { query: { $populate: 'roles' } });

		expect(roles[0].permissions).to.include(testedPermission);

		const jwt = await supportJWTService.create({ userId: student.userId }, superhero.requestParams);

		const decodedJWT = decode(jwt);

		const { expiredOffset } = supportJWTService;

		expect(decodedJWT.support).to.be.true;
		expect(decodedJWT.accountId).to.be.equal(student.accountId);
		expect(decodedJWT.userId).to.be.equal(student.userId);
		expect(decodedJWT.sub).to.be.equal(student.accountId);
		expect(decodedJWT.exp <= new Date().valueOf() + expiredOffset).to.be.true;
	});

	it(`create without ${testedPermission} permission should not work.`, async () => {
		const [teacher, student] = await Promise.all([
			testObjects.setupUser({ roles: 'teacher' }),
			testObjects.setupUser({ roles: 'student' }),
		]);

		const { roles } = await app.service('users').get(teacher.user._id, { query: { $populate: 'roles' } });

		try {
			await supportJWTService.create({ userId: student.userId }, teacher.requestParams);
		} catch (err) {
			expect(roles[0].permissions).to.not.include(testedPermission);
			expect(err.code).to.be.equal(403);
		}
	});
});
