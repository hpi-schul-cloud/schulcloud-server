// TODO Delete me please
const assert = require('assert');
const chai = require('chai');
const { decode } = require('jsonwebtoken');

const { expect } = chai;

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

describe('supportJWTService', () => {
	let app;
	let supportJWTService;
	let meService;
	const testedPermission = 'CREATE_SUPPORT_JWT';

	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		supportJWTService = app.service('accounts/supportJWT');
		meService = app.service('legacy/v1/me');
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
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
		const superhero = await testObjects.setupUser({ roles: 'superhero' });
		const student = await testObjects.setupUser({ roles: 'student' });

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
		const teacher = await testObjects.setupUser({ roles: 'teacher' });
		const student = await testObjects.setupUser({ roles: 'student' });

		const { roles } = await app.service('users').get(teacher.user._id, { query: { $populate: 'roles' } });

		try {
			await supportJWTService.create({ userId: student.userId }, teacher.requestParams);
		} catch (err) {
			expect(roles[0].permissions).to.not.include(testedPermission);
			expect(err.code).to.be.equal(403);
		}
	});

	it('accountId, userId, roles, and schoolId values should be present in jwtData', async () => {
		const superhero = await testObjects.setupUser({ roles: 'superhero' });
		const student = await testObjects.setupUser({ roles: 'student' });

		const jwt = await supportJWTService.create({ userId: student.userId }, superhero.requestParams);

		const { accountId, userId, roles, schoolId } = decode(jwt);

		expect(accountId).to.be.equal(student.account.id.toString());
		expect(userId).to.be.equal(student.user._id.toString());
		expect(roles[0]).to.be.equal(student.user.roles[0].toString());
		expect(schoolId).to.be.equal(student.user.schoolId.toString());
	});

	it('superhero data should be the same as the requested user data when using the support jwt', async () => {
		const superhero = await testObjects.setupUser({ roles: 'superhero' });
		const student = await testObjects.setupUser({ roles: 'student' });

		const requestedUserJwt = await supportJWTService.create({ userId: student.userId }, superhero.requestParams);

		let meSHdata = await meService.find(superhero.requestParams);
		expect(meSHdata._id).to.not.be.equal(student.user._id.toString());

		superhero.requestParams.authentication.accessToken = requestedUserJwt;
		meSHdata = await meService.find(superhero.requestParams);
		expect(meSHdata._id).to.be.equal(student.user._id.toString());
	});
});
