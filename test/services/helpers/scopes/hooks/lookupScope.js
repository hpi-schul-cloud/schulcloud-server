const chai = require('chai');
const { default: chaiAsPromised } = require('chai-as-promised');
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
		await expect(lookupScope({})).to.be.rejectedWith(BadRequest);
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
		await expect(lookupScope(context)).to.be.rejectedWith(BadRequest);
		expect(context.params.scope).to.equal(undefined);
	});

	it('should fail if no scopeId is provided', async () => {
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
		await expect(lookupScope(context)).to.be.rejectedWith(BadRequest);
		expect(context.params.scope).to.equal(undefined);
	});

	it('should fail if no service responds to the scope', async () => {
		const tomato = {
			_id: new ObjectId(),
			foo: 'bar',
		};
		const context = {
			app: fakeApp(),
			params: { route: { scopeId: tomato._id } },
			path: `/tomatoes/${tomato._id.toString()}/userPermissions/`, // tomato service does not exist
		};
		await expect(lookupScope(context)).to.be.rejectedWith(BadRequest);
		expect(context.params.scope).to.equal(undefined);
	});
});
