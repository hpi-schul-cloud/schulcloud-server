const assert = require('assert');
const chai = require('chai');
const decode = require('jwt-decode');

const { expect } = chai;

const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const supportJWTService = app.service('accounts/supportJWT');
const testedPermission = 'CREATE_SUPPORT_JWT';

describe('supportJWTService', () => {
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

		const { roles } = await app.service('users')
			.get(superhero.user._id, { query: { $populate: 'roles' } });

		expect(roles[0].permissions).to.include(testedPermission);

		const userId = student.user._id.toString();
		const jwt = await supportJWTService
			.create({ userId }, { account: { userId: superhero.user._id } });

		const decodedJWT = decode(jwt);

		const { expiredOffset } = supportJWTService;
		const studentAccountId = student.account._id.toString();

		expect(decodedJWT.support).to.be.true;
		expect(decodedJWT.accountId).to.be.equal(studentAccountId);
		expect(decodedJWT.userId).to.be.equal(userId);
		expect(decodedJWT.sub).to.be.equal(studentAccountId);
		expect(decodedJWT.exp <= new Date().valueOf() + expiredOffset).to.be.true;
	});

	it(`create without ${testedPermission} permission should not work.`, async () => {
		const [teacher, student] = await Promise.all([
			testObjects.setupUser({ roles: 'teacher' }),
			testObjects.setupUser({ roles: 'student' }),
		]);

		const { roles } = await app.service('users')
			.get(teacher.user._id, { query: { $populate: 'roles' } });

		expect(roles[0].permissions).to.not.include(testedPermission);

		const userId = student.user._id.toString();

		const result = await supportJWTService.create({ userId }, { account: { userId: teacher.user._id } });
		expect((result || {}).code).to.be.equal(403);
	});

	after(testObjects.cleanup);
});
