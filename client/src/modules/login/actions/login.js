import React from 'react';

import hooks from 'feathers-hooks';
import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import io from 'socket.io-client';

const socket = io('http://localhost:3030/');
const server = feathers().configure(socketio(socket));

const userService = server.service('/users');

export default {
	login: ({email, password}) => {
		console.log(email, password);
		//userService.create({firstName: 'Bla'});
	}
};
