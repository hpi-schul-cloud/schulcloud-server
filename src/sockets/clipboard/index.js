'use strict';

const socketio = require('feathers-socketio');
const siofu = require("socketio-file-upload");
const logger = require('winston');
const path = require("path");

module.exports = function () {
	const app = this;
	var images = {};
	app.use(siofu.router);
	app.configure(socketio((io) => {

		let clipboardWs = io.of('clipboard');
		clipboardWs.on('connection', (socket) => {

			let courseId = socket.request._query.courseId;
			if(!courseId) return;
			let user = {};
			app.service('users').get(socket.client.userId).then((result) => { user = result;});

			logger.debug("someone connected to room " + courseId);
			socket.join(courseId);

			socket.on("refreshClipboard", () => {
				socket.emit("clipboardState", images[courseId] || []);
			});

			socket.on("pushToClipboard", (media) => {
				logger.debug(media);
				clipboardWs.to(courseId).emit("pushToClipboard", media);
			});

			var uploader = new siofu();
			uploader.dir = "uploads";
			uploader.listen(socket);
			uploader.on("start", function(event){
				logger.debug("upload started " + event.file.name);
			});
			uploader.on("saved", function(event){
				let filename = path.basename(event.file.pathName);
				let file = {
					file: filename,
					sender: user && (user.firstName + " " + user.lastName)
				};
				clipboardWs.to(courseId).emit('clipboardUpdate', file);
				images[courseId] = images[courseId] || [];
				images[courseId].push(file);
			});
		});
	}));
};
