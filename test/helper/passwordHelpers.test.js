const chai = require('chai');
const { expect } = chai;
const { checkPasswordStrength, passwordsMatch } = require('../../src/helper/passwordHelpers');

describe('passwordHelpers tests', function () {
	describe('checking validity of password strength', function () {
		it('should return false if the passwords do NOT match the requirements', function () {
			const someWeekPasswords = ['somepassword', 'somepassword1', 'somepassword1!', 'somepassword1!@#', 'afsf@#$'];
			someWeekPasswords.forEach((weakPassword) => {
				expect(checkPasswordStrength(weakPassword))
					.to.equal(false);
			});
		});
		it('should return true if the passwords match the requirements', function () {
			const someWeekPasswords = ['somepassworD4!', 'somepassworD5!', 'somepassworD!5!', 'somepassworD!5!@#', 'somepassworD!AFD#@$#3@DSAF@Q#$ADF@#$SDF@#$'];
			someWeekPasswords.forEach((weakPassword) => {
				expect(checkPasswordStrength(weakPassword))
					.to.equal(true);
			});
		});
	});

	describe('checking whether passwords match', () => {
		it('should return false if passwords do not match to each other', function () {
			const passwordOne = 'passwordOne!1';
			const passwordTwo = 'passwordOne!2';
			expect(passwordsMatch(passwordOne, passwordTwo))
				.to.equal(false);
		});

		it('should return true if passwords match to each other', function () {
			const passwordOne = 'passwordOne!1';
			const passwordTwo = 'passwordOne!1';
			expect(passwordsMatch(passwordOne, passwordTwo))
				.to.equal(true);
		});
	});
});
