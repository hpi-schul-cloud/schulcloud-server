const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;
const { Forbidden, BadRequest } = require('@feathersjs/errors');
const {
	lookupScope,
	rejectQueryingOtherUsers,
} = require('../../../../../src/services/helpers/scopePermissions/hooks');

chai.use(chaiAsPromised);
const { expect } = chai;

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

		it('should fail if a user requests a different user id on user scope', () => {
			const userId = new ObjectId();
			const id = new ObjectId().toString();
			const params = {
				account: { userId },
				route: { scopeId: id },
			};
			expect(() => fut({ method: 'find', params, path: `users/${id}/courses` })).to.throw(Forbidden);
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
			expect(() => fut({
				method: 'find',
				params: { ...params, route: { scopeId: id } },
				path: `users/${id}/courses`,
			})).not.to.throw();
		});
	});

	describe('lookupScope', () => {
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

		it('should fail if required params are missing', async () => {
			expect(lookupScope({})).to.eventually.throw(BadRequest);
		});

		it('adds the requested team to the query', async () => {
			const team = {
				_id: new ObjectId(),
				foo: 'bar',
			};
			const context = {
				app: fakeApp(team),
				params: { route: { scopeId: team._id } },
				path: `/teams/${team._id.toString()}/userPermissions/`,
			};
			expect(() => lookupScope(context)).not.to.throw();
			expect(await lookupScope(context)).to.deep.equal(context);
			expect(context.params.scope).to.deep.equal(team);
		});

		it('should fail if no scope is provided', async () => {
			const team = {
				_id: new ObjectId(),
				foo: 'bar',
			};
			const context = {
				app: fakeApp(team),
				params: { route: { scopeId: team._id } },
				// context.path is not set, so no scope name can be derived
			};
			expect(lookupScope(context)).to.eventually.throw(BadRequest);
			expect(context.params.scope).to.equal(undefined);
		});

		it('should fail if no scopeId is provided', () => {
			const team = {
				_id: new ObjectId(),
				foo: 'bar',
			};
			const context = {
				app: fakeApp(team),
				params: { route: { /* scopeId: team._id */ } },
				path: `/teams/${team._id.toString()}/userPermissions/`,
			};
			expect(lookupScope(context)).to.eventually.throw(BadRequest);
			expect(context.params.scope).to.equal(undefined);
		});

		it('should fail if no service responds to the scope', () => {
			const tomato = {
				_id: new ObjectId(),
				foo: 'bar',
			};
			const context = {
				app: fakeApp(),
				params: { route: { scopeId: tomato._id } },
				path: `/tomatoes/${tomato._id.toString()}/userPermissions/`, // tomato service does not exist
			};
			expect(lookupScope(context)).to.eventually.throw(BadRequest);
			expect(context.params.scope).to.equal(undefined);
		});
	});
});
