import { expect } from 'chai';

import { userModel as User } from '../../../src/services/user/model';

describe('user model', () => {
	describe('fullName property', () => {
		it('should concat all name fields into one string', () => {
			const user = new User({
				namePrefix: 'Dr.',
				firstName: 'John',
				middleName: 'F.',
				lastName: 'Doe',
				nameSuffix: 'jr.',
			});
			expect(user.fullName).to.equal('Dr. John F. Doe jr.');
		});

		it('should work if some fields are undefined', () => {
			const pavel = new User({
				firstName: 'Pavel',
				lastName: 'Slotschki',
				nameSuffix: 'II.',
			});
			expect(pavel.fullName).to.equal('Pavel Slotschki II.');

			const karel = new User({
				namePrefix: 'Mister',
				firstName: 'Karel',
				lastName: 'Slotschki',
			});
			expect(karel.fullName).to.equal('Mister Karel Slotschki');
		});
	});
});
