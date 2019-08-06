const { getConnectionOptions } = require('./src/utils/database');

const options = getConnectionOptions();
let { url } = options;
if (options.username) {
	url = url.replace(/^mongodb:\/\//i, '');
	url = `mongodb://${options.username}:${options.password}@${url}`;
}

module.exports = {
	d: url, // database connection url
	t: './migrations/template.js', // use custom migration template
};
