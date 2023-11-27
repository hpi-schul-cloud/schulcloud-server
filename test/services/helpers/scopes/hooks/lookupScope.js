const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;

const { BadRequest } = require('../../../../../src/errors');
const { lookupScope } = require('../../../../../src/services/helpers/scopePermissions/hooks/lookupScope');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('lookupScope', () => {
	const fakeApp = (teamToReturn) => ({
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
			params: {
				route: {
					/* scopeId: team._id */
				},
			},
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
