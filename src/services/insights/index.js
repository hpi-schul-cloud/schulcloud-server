const {
	monthlyUsers, weeklyUsers, weeklyActivity, roleActivity, weeklyActiveUsers,
} = require('./services');


module.exports = (app) => {
	app.configure(monthlyUsers);
	app.configure(weeklyUsers);
	app.configure(weeklyActivity);
	app.configure(roleActivity);
	app.configure(weeklyActiveUsers);
};

// todo.
// Extract URI to .env
// Finish the tests
