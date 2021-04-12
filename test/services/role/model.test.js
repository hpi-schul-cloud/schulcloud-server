const { expect } = require('chai');

const Role = require('../../../src/services/role/model');

describe('role model', () => {
	describe('displayName property', () => {
		it('should map the english role name to a german displayName', () => {
			const role = new Role({
				name: 'teacher',
				permissions: [],
				roles: [],
			});
			expect(role.displayName).to.equal('Lehrer');
		});
		it('should be empty if name property is missing', () => {
			const role = new Role({
				name: '',
				permissions: [],
				roles: [],
			});
			expect(role.displayName).to.equal('');
		});
	});
});
