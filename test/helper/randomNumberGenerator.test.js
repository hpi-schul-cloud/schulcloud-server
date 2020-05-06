const { getRandomInt } = require('../../src/helper/randomNumberGenerator');
const { expect, assert } = require('chai');

describe('randomNumberGenerator helper', () => {
	it('should throw an exception when difference between max number and min number exceed allowed treshold 256^6-1 (6 bytes)', () => {
		const maxAllowedRange = 281474976710656; // 6 bytes 256^6-1
		assert.throws(() => getRandomInt(maxAllowedRange), 'Specified range is to big - cannot be greather than 256^6-1 = 281474976710656');
	});

	it('should by default min parameter to be equal 0 therefore not generated number less than 0', () => {
		let arrayWithRandomNumbers = [];
		const maxNumber = 100;
		const minDefaultNumber = 0;
		for (let i = 0; i < 100000; i++) {
			arrayWithRandomNumbers.push(getRandomInt(maxNumber));
		}
		const maxNumberFromArray = Math.max(...arrayWithRandomNumbers);
		const minNumberFromArray = Math.min(...arrayWithRandomNumbers);
		expect(maxNumberFromArray).to.be.lessThan(maxNumber + 1);
		expect(minNumberFromArray).to.be.greaterThan(minDefaultNumber - 1);
	});

	it('should generate numbers between specified range', () => {
		let arrayWithRandomNumbers = [];
		const maxNumber = 100;
		const minNumber = -100;
		for (let i = 0; i < 100000; i++) {
			arrayWithRandomNumbers.push(getRandomInt(maxNumber, minNumber));
		}
		const maxNumberFromArray = Math.max(...arrayWithRandomNumbers);
		const minNumberFromArray = Math.min(...arrayWithRandomNumbers);

		expect(maxNumberFromArray).to.be.lessThan(maxNumber + 1);
		expect(minNumberFromArray).to.be.greaterThan(minNumber - 1);
	});
});
