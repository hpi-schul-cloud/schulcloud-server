const { getRandomInt } = require('../../utils/randomNumberGenerator');

const rnd36 = () => getRandomInt(35).toString(36);

const rndSpecial = () => {
	const c = ['!', '$', '.'];
	return c[getRandomInt(c.length - 1)];
};

const rndChar = () => {
	const x = getRandomInt(9);
	if (x < 3) return rnd36();
	if (x < 6) return rnd36().toLocaleLowerCase();
	if (x < 9) return rnd36().toLocaleUpperCase();
	return rndSpecial();
};

const generatePass = (m) => {
	let pass = '';
	for (let i = 0; i < m; i += 1) {
		pass += rndChar();
	}
	return pass;
};

const generateSuffix = (m) => {
	let suffix = '';
	for (let i = 0; i < m; i += 1) {
		suffix += rnd36();
	}
	return suffix;
};

exports.randomPass = (max) => generatePass(max || 36);

exports.randomSuffix = (max) => generateSuffix(max || 4);
