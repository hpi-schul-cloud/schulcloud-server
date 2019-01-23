'use strict';

const socketio = require('feathers-socketio');
const siofu = require("socketio-file-upload");
const actions = require('./actions');
const upload = require('./upload');
const ClipboardModel = require('./clipboard-model');
const logger = require('winston');

module.exports = function () {
	const app = this;
	
	app.use(siofu.router);
	app.configure(socketio((io) => {

		var courses = {};

		let joinCourse = (socket) => {
			return new Promise((resolve, reject) => {
				let courseId = socket.request._query.courseId;
				socket.meta.courseId = courseId;
				socket.join(courseId, (err) => {
					if(err) return reject(err);
					return resolve();
				});
			});
		};
	
		let initCourse = (socket) => () => {
			let courseId = socket.meta.courseId;
			if(!courses[courseId]) courses[courseId] = {
				desks: {
					teachers: {},
					students: {},
					groups: {},
				},
				users: {
					students: {},
					teachers: {}
				},
				board: {
					layout: '1x1',
					media: {}
				},
				lastId: 0,
				broadcastUpdate(...keys) {
					const update = keys.reduce((acc, key) => {
						acc[key] = this[key];
						return acc;
					}, {});
					io.of('clipboard').to(courseId).emit('clipboardStateUpdate', update);

					ClipboardModel.findOneAndUpdate({
						_id: socket.meta._id
					}, {
						state: {
							board: this.board,
							desks: this.desks,
							lastId: this.lastId
						}
					}, function(err){
						if (err) throw Error(err);
					});
				}
			};
			socket.meta.course = courses[courseId];
		};

		
		let initModel = (socket) => () => new Promise((resolve, reject) => {
			let query = {
				course: socket.meta.courseId
			};
			ClipboardModel.findOneAndUpdate(query, {
				course: socket.meta.courseId,
				version: 1,
			}, {upsert:true}, function(err, doc){
				if (err) return reject(err);
				if (!doc) return resolve();
				if(doc.state && doc.state.board) socket.meta.course.board = doc.state.board;
				if(doc.state && doc.state.desks) socket.meta.course.desks = doc.state.desks;
				if(doc.state.lastId) socket.meta.course.lastId = doc.state.lastId;
				socket.meta._id = doc._id;
				resolve();
			});
		});
		
		let getUser = (socket) => () => {
			return app.service('users').get(socket.client.userId).then((result, err) => { 
					let user = {
						id: result._id,
						role: result.permissions.indexOf("USERGROUP_EDIT") >= 0 ? 'teacher' : 'student',
						name: result.displayName,
					};
					user.bucket = user.role + 's';
					socket.meta.user = user;
				});
		};
	
		let initUserInCourse = (socket) => () => {
			const {user, course} = socket.meta;
			course.users[user.bucket][user.id] = user;
			if(!course.desks[user.bucket][user.id]) {
				course.desks[user.bucket][user.id] = {
					media: [],
					board: {
						layout: '1x1',
						media: {}
					}
				};
			}
			course.desks[user.bucket][user.id].name = user.name;
			course.desks[user.bucket][user.id].userConnected = true;
			course.broadcastUpdate('users', 'desks');
		};

		let sendFullState = (socket) => () => {
			socket.emit("clipboardState", {
				...socket.meta.course,
				me: socket.meta.user
			}); //on connect send inital state
		};

		let clipboardWs = io.of('clipboard');
		clipboardWs.on('connection', (socket) => {
			socket.meta = {};

			getUser(socket)()
				.then(initCourse(socket))
				.then(initModel(socket))
				.then(joinCourse(socket))
				.then(initUserInCourse(socket))
				.then(upload(socket))
				.then(sendFullState(socket))
				.then(actions(socket))
				.catch(logger.error);
		});
	}));
};
