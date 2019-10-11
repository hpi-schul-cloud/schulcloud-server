const {
	monthlyUsers, weeklyUsers, weeklyActivity, roleActivity, weeklyActiveUsers, dauOverMau,
} = require('./services');


module.exports = (app) => {
	app.configure(monthlyUsers);
	app.configure(weeklyUsers);
	app.configure(weeklyActivity);
	app.configure(roleActivity);
	app.configure(weeklyActiveUsers);
	app.configure(dauOverMau);
};

// todo.
// Extract URI to .env
// Finish the tests
// set up VUE components
