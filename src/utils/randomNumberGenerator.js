const crypto = require('crypto');

module.exports = {
	getRandomInt: (max, min = 0) => {
		const maxDec = 281474976710656;
		if (max - min > maxDec - 1) {
			throw new Error('Specified range is to big - cannot be greather than 256^6-1 = 281474976710656');
		}
		const randomInt = parseInt(crypto.randomBytes(6)
			.toString('hex'), 16);
		return (randomInt % (max + 1 - min)) + min;
	},
};
