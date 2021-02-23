const sinon = require('sinon');
const chai = require('chai');
const { ObjectId } = require('mongoose').Types;
const userRoleUc = require('./userRoles.uc');

const { userRepo } = require('../repo/index');

const { expect } = chai;

describe('userRoles Usecase', () => {
	describe('hasRole', () => {
		let userRolesStub;

		afterEach(async () => {
			userRolesStub.restore();
		});

		it('when the user has the role specified, then it returns true', async () => {
			const userId = new ObjectId();
			userRolesStub = sinon.stub(userRepo, 'getUserWithRoles');
			userRolesStub.withArgs(userId).returns({ roles: [{ name: 'student' }] });

			const result = await userRoleUc.hasRole(userId, 'student');
			expect(result).to.be.true;
		});

		it('when the user has multiple roles including the role specified, then it returns true', async () => {
			const userId = new ObjectId();
			userRolesStub = sinon.stub(userRepo, 'getUserWithRoles');
			userRolesStub.withArgs(userId).returns({ roles: [{ name: 'student' }, { name: 'teacher' }] });

			const result = await userRoleUc.hasRole(userId, 'student');

			expect(result).to.be.true;
		});

		it('when the user has does not have the role specified, then it returns false', async () => {
			const userId = new ObjectId();
			userRolesStub = sinon.stub(userRepo, 'getUserWithRoles');
			userRolesStub.withArgs(userId).returns({ roles: [{ name: 'teacher' }] });

			const result = await userRoleUc.hasRole(userId, 'student');

			expect(result).to.be.false;
		});
	});
});
