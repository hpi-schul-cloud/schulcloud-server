const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { Project, Board } = require('./services');

const { boardsHooks, projectsHooks } = require('./hooks');

module.exports = (app) => {
	const projectRoute = '/nexboard/projects';
	const boardRoute = '/nexboard/boards';

	app.use('/nexboard/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use(projectRoute, new Project());
	app.use(boardRoute, new Board());

	const projects = app.service(projectRoute);
	projects.hooks(projectsHooks);

	const boards = app.service(boardRoute);
	boards.hooks(boardsHooks);
};
