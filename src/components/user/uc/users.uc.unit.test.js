const { expect } = require('chai');
const { deleteUser } = require('./users.uc');

describe('users usecase', () => {
	describe('user delete orchestrator', () => {
		it('when the function is called, then it returns (replace with useful test)', () => {
			// arrange

			// act
			const result = deleteUser();

			// assert
			expect(result).to.deep.equal({ success: true });
		});
	});
});
