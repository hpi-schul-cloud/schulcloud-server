const users = require('./user');

const configure = (app) => {
	users(app);
};

module.exports = {
	configure,
};
