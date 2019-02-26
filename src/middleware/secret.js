let secrets;
try {
	(['production', 'local'].includes(process.env.NODE_ENV))
		? secrets = require('../../config/secrets.js')
		: secrets = require('../../config/secrets.json');
} catch (error) {
	secrets = {};
}

exports.secrets = secrets;
