const { getConnectionOptions } = require('./src/utils/database');

const options = getConnectionOptions();
let { url } = options;
if (options.username) {
	url = `${options.username}:${options.password}@${url}`;
}

module.exports = {
	d: url, // database connection url
	t: './migrations/template.js', // use custom migration template
};
