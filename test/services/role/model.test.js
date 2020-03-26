const { expect } = require('chai');

const { getModelRoles } = require('../../../src/services/role/services/rolesService');

describe('role model', () => {
	describe('displayName property', () => {
		it('should map the english role name to a german displayName', async () => {
			const role = await getModelRoles({ name: 'teacher' });
			expect(role.displayName).to.equal('Lehrer');
		});
		it('should be empty if name property is missing', async () => {
			const role = await getModelRoles({ name: 'user' });
			expect(role.displayName).to.equal('');
		});
	});
});
