const { expect } = require('chai');

const customUtils = require('../../../../src/services/activation/utils/customStrategyUtils');

describe('activation/utils customeUtils', () => {
	describe('construction and deconstruction pattern of quarantinedObject', () => {
		it(`${customUtils.KEYWORDS.E_MAIL_ADDRESS}`, () => {
			const keyword = customUtils.KEYWORDS.E_MAIL_ADDRESS;
			const email = 'test@mail.de';
			const quarantinedObject = customUtils.createQuarantinedObject(keyword, email);
			const reconstructedData = customUtils.getQuarantinedObject({ keyword, quarantinedObject });
			expect(reconstructedData).to.be.equal(email);
		});
	});
});
