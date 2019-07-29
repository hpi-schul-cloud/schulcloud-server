const hooks = require('../../../../src/services/user-group/hooks/index');

describe('course hooks', () => {
	describe('restrict changes to archived course', () => {
		it('returns for active courses', () => {
			console.log(hooks);
		});

		it('returns when changing untilDate on expired course');

		it('fails when changing other fields of expired course');
	});
});
