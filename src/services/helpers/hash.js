const bcrypt = require('bcryptjs');
const { BadRequest } = require('../../errors');
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

module.exports = function setup() {
	class HashService {
		constructor(options) {
			this.options = options || {};
			this.docs = {};
		}

		async create(data) {
			if (data.toHash === undefined) {
				throw new BadRequest('Please set toHash key.');
			}
			const salt = await bcrypt.genSalt(8);

			let hash = await bcrypt.hash(data.toHash, salt);

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
