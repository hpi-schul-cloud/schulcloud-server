const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');
const bcrypt = require('bcryptjs');
const { promisify } = require('es6-promisify');
const { userModel } = require('../user/model');
const { getRandomInt } = require('../../utils/randomNumberGenerator');

const rndChar = () => {
	const chars = [
		'A',
		'B',
		'C',
		'D',
		'E',
		'F',
		'G',
		'H',
		'I',
		'J',
		'K',
		'L',
		'M',
		'N',
		'O',
		'P',
		'R',
		'S',
		'T',
		'U',
		'V',
		'W',
		'0',
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
	];
	return chars[getRandomInt(chars.length - 1)];
};

module.exports = function setup(app) {
	const genSaltAsync = promisify(bcrypt.genSalt);
	const genHashAsync = promisify(bcrypt.hash);
	class HashService {
		constructor(options) {
			this.options = options || {};
			this.docs = {};
		}

		async create(data, params) {
			if (data.toHash === undefined) {
				throw new BadRequest('Please set toHash key.');
			}
			const salt = await genSaltAsync(8);

			let hash = await genHashAsync(data.toHash, salt);

			if (data.save === true || data.save === 'true') {
				hash = hash.replace(/\/|\$|\./g, rndChar());
			}
			if (data.patchUser === true || data.patchUser === 'true') {
				await userModel
					.findOneAndUpdate(
						{ email: data.toHash },
						{
							$set: {
								importHash: hash,
							},
						}
					)
					.exec();
			}

			return hash;
		}
	}

	return HashService;
};
