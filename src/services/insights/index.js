const {
	monthlyUsers, weeklyUsers,
} = require('./services');


module.exports = (app) => {
	app.configure(monthlyUsers);
	app.configure(weeklyUsers);
};
