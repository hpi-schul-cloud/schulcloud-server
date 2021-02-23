const chai = require('chai');
const { checkPasswordStrength, passwordsMatch } = require('../../src/utils/passwordHelpers');

const { expect } = chai;

describe('passwordHelpers tests', () => {
	describe('checking validity of password strength', () => {
		it('should return false if the passwords do NOT match the requirements', () => {
			const someWeekPasswords = ['somepassword', 'somepassword1', 'somepassword1!', 'somepassword1!@#', 'afsf@#$'];
			someWeekPasswords.forEach((weakPassword) => {
				expect(checkPasswordStrength(weakPassword)).to.equal(false);
			});
		});
		it('should return true if the passwords match the requirements', () => {
			const someWeekPasswords = [
				'somepassworD4!',
				'somepassworD5!',
				'somepassworD!5!',
				'somepassworD!5!@#',
				'somepassworD!AFD#@$#3@DSAF@Q#$ADF@#$SDF@#$',
			];
			someWeekPasswords.forEach((weakPassword) => {
				expect(checkPasswordStrength(weakPassword)).to.equal(true);
			});
		});
	});

	describe('checking whether passwords match', () => {
		it('should return false if passwords do not match to each other', () => {
			const passwordOne = 'passwordOne!1';
			const passwordTwo = 'passwordOne!2';
			expect(passwordsMatch(passwordOne, passwordTwo)).to.equal(false);
		});

		it('should return true if passwords match to each other', () => {
			const passwordOne = 'passwordOne!1';
			const passwordTwo = 'passwordOne!1';
			expect(passwordsMatch(passwordOne, passwordTwo)).to.equal(true);
		});
	});
});
