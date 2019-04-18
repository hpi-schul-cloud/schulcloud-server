const assert = require('assert');
const promisify = require('es6-promisify');
const itsLearningService = require('../../../../src/services/account/strategies/itslearning.js');
const { expect } = require('chai');

const itsLearningLoginService = new itsLearningService();

describe('ITSLearning System', () => {
	const newTestAccount = {
		username: 'Lars.Lange',
		password: 'zJ9L5pVg',
	};
	const faultyTestAccount = {
		username: 'LarsL.Lange',
		password: 'zJ9L5pVgL',
	};

	it.skip('should be able to retrieve username/hash/etc.', function () {
		this.timeout(20000);
		return itsLearningLoginService.login(newTestAccount, 'https://developer.itslbeta.com').then((response) => {
			expect(response).to.not.be.nil;
			expect(response.username).to.equal(newTestAccount.username);
			expect(response.success).to.be.true;
		});
	});

	it.skip('should not be able to retrieve anything useful', function () {
		this.timeout(20000);
		return itsLearningLoginService.login(faultyTestAccount, 'https://developer.itslbeta.com')
			.then((result) => {
				expect(result).to.be.nil;
			})
			.catch((error) => {
				expect(error).to.not.be.nil;
			});
	});
});
