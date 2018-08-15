'use strict';

const auth = require('feathers-authentication');
const socketio = require('feathers-socketio');
const jwtDecode = require('jwt-decode');
const compress = require('compression');
const express = require('express');
var siofu = require("socketio-file-upload");

module.exports = function () {
	const app = this;
	var images = {};
	app.use(siofu.router);
	app.use('/clipboard/uploads', express.static('uploads'));
	app.configure(socketio({
		path: '/clipboard-ws/'
	  },(io) => {

		io.use(function (socket, next) {
			// Exposing a request property to services and hooks
			socket.feathers.headers = socket.handshake.headers;
			next();
		  });
		
		io.use(auth.express.authenticate('jwt'));

		io.on('connection', (socket) => {

			let courseId = socket.request._query.courseId;
			if(!courseId) return;
			let user = {};
			app.service('users').get(jwtDecoded.userId).then((result) => { user = result});

			console.log("someone connected to room " + courseId);
			socket.join(courseId);

			socket.on("refreshClipboard", () => {
				socket.emit("clipboardState", images[courseId] || []);
			});

			socket.on("pushToClipboard", (media) => {
				console.log(media);
				io.to(courseId).emit("pushToClipboard", media);
			});

			var uploader = new siofu();
			uploader.dir = "uploads";
			uploader.listen(socket);
			uploader.on("start", function(event){
				console.log("upload started " + event.file.name);
			})
			uploader.on("saved", function(event){
				let file = {
					file: event.file.name,
					sender: user && (user.firstName + " " + user.lastName)
				};
				io.to(courseId).emit('clipboardUpdate', file);
				images[courseId] = images[courseId] || [];
				images[courseId].push(file);
			})
		});
	}));
};
