const {
	Project,
	Board,
} = require('./services/');
const { before, after } = require('./hooks');

module.exports = function setup() {
	const app = this;

	const projectRoute = '/nexboard/projects';
	const boardRoute = '/nexboard/boards';

	app.use(projectRoute, new Project());
	app.use(boardRoute, new Board());

	const projects = app.service(projectRoute);
	projects.before(before);
	projects.after(after);

	const boards = app.service(boardRoute);
	boards.before(before);
	boards.after(after);
};
