const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const { Forbidden, BadRequest } = require('@feathersjs/errors');
const {
	lookupTeam,
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

	describe.only('lookupTeam', () => {
		const fakeApp = teamToReturn => ({
			service: (serviceName) => {
				if (serviceName.match(/^\/?teams\/?$/i)) {
					return {
						get: () => Promise.resolve(teamToReturn),
						find: () => Promise.resolve(teamToReturn),
					};
				}
				return undefined;
			},
		});

		it('adds the requested team to the query', async () => {
			const team = {
				_id: new ObjectId(),
				foo: 'bar',
			};
			const context = {
				app: fakeApp(team),
				params: { route: { scopeId: team._id } },
			};
			expect(() => lookupTeam(context)).not.to.throw();
			expect(await lookupTeam(context)).to.deep.equal(context);
			expect(context.params.team).to.deep.equal(team);
		});

		it('should fail if params are not correctly set', () => {
			expect(() => lookupTeam({})).to.be.rejected;
		});
	});
});
