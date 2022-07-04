const tasksFacade = require('./uc/task.facade');

module.exports = (app) => {
	app.configure(tasksFacade);
};
