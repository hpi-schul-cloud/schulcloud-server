const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const { Forbidden, BadRequest } = require('@feathersjs/errors');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const {
	rejectQueryingOtherUsers,
} = require('../../../../src/services/teams/hooks/scopePermissions.js');

describe('scopePermissionService hook', () => {
	describe('rejectQueryingOtherUsers', () => {
		const fut = rejectQueryingOtherUsers;

		it('should fail if a user requests a different user id on GET', () => {
			const userId = new ObjectId();
			const id = new ObjectId().toString();
			const params = { account: { userId } };
			expect(() => fut({ method: 'get', id, params })).to.throw(Forbidden);
		});

		it('should fail if a user requests a different user id on FIND', () => {
			const userId = new ObjectId();
			const id = new ObjectId().toString();
			const params = {
				account: { userId },
				query: { userId: id },
			};
			expect(() => fut({ method: 'find', params })).to.throw(Forbidden);
		});

		it('should fail if no user id is requested', () => {
			const userId = new ObjectId();
			const params = { account: { userId } };
			expect(() => fut({ method: 'find', params })).to.throw(BadRequest);
		});

		it('should fail for all methods except find & get', () => {
			const userId = new ObjectId();
			const params = { account: { userId } };
			expect(() => fut({ params })).to.throw(BadRequest);
			expect(() => fut({ method: 'delete', params })).to.throw(BadRequest);
		});

		it('should let external requesters only query their own userId', () => {
			const userId = new ObjectId();
			const id = userId.toString();
			const params = {
				account: { userId },
			};
			expect(() => fut({ method: 'find', params: { ...params, query: { userId: id } } })).not.to.throw();
			expect(() => fut({ method: 'get', id, params })).not.to.throw();
		});
	});
});
