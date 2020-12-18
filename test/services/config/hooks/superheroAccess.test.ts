import { expect } from 'chai';

import { superheroAccess } from '../../../../src/services/config/hooks';

class MockService {
	setup(app) {
		this.app = app;
	}

	async get(id, params) {
		if (id === '123') {
			return {
				roles: [{ name: 'superhero' }],
			};
		}
		return {
			roles: [{ name: 'student' }],
		};
	}
}

describe('superheroAccess hook in config', () => {
	const mockUserService = new MockService();
	const app = {
		service: (serviceName) => {
			if (serviceName === '/users/') {
				return mockUserService;
			}
			return undefined;
		},
	};

	it('superheros should pass', async () => {
		const context = {
			params: {
				account: {
					userId: '123',
				},
				provider: 'rest',
			},
			app,
		};
		const result = await superheroAccess(context);
		expect(result).to.eql(result);
	});

	it('non superhero should NOT pass', async () => {
		const context = {
			params: {
				account: {
					userId: '222',
				},
				provider: 'rest',
			},
			app,
		};
		try {
			await superheroAccess(context);
		} catch (err) {
			expect(err.code).equal(403);
			expect(err.message).to.equal('You has no access.');
		}
	});
});
