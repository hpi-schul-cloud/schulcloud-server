const { expect } = require('chai');

const { getUsername, getEmail } = require('../../../../../src/services/sync/strategies/TSP/TSP');

const users = {
	testUser0: {
		sourceOptions: {
			tspUid: 'fOo',
		},
	},
	testUser1: {
		authUID: 'baR',
	},
	testUser2: {
		sourceOptions: {
			tspUid: 'Baz',
		},
		authUID: '42',
	},
	testUser3: {
		id: null,
	},
};

describe('TSP API unit tests', () => {
	it('gets username', () => {
		expect(getUsername(users.testUser0)).to.equal('tsp/foo');
		expect(getUsername(users.testUser1)).to.equal('tsp/bar');
		expect(getUsername(users.testUser2)).to.equal('tsp/baz');
		expect(() => getUsername(users.testUser3)).to.throw();
	});

	it('gets email', () => {
		expect(getEmail(users.testUser0)).to.equal('tsp/foo@schul-cloud.org');
		expect(getEmail(users.testUser1)).to.equal('tsp/bar@schul-cloud.org');
		expect(getEmail(users.testUser2)).to.equal('tsp/baz@schul-cloud.org');
		expect(() => getEmail(users.testUser3)).to.throw();
	});
});
