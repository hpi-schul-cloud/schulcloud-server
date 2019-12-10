const { eduSearch } = require('./services');

module.exports = (app) => {
	app.configure(eduSearch);
};
