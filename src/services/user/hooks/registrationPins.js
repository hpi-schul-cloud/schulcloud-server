'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const _ = require('lodash');

const removeOldPin = (hook) => {
	return hook.app.service('registrationPins').find({email: hook.data.email})
		.then(pins => {
			let a = 1;
			if (pins.total > 0) {
				return hook.app.service('registrationPins').remove(pins.data[0]._id)
					.then(response => {
						return Promise.resolve(hook);
					});
				}
			return Promise.resolve(hook);
		});
};

const generatePin = (hook) => {
	let pin = Math.floor((Math.random() * 9999)+1000);
	hook.data.pin = pin.toString();
	return Promise.resolve(hook);
};

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [removeOldPin,generatePin],
	update: [],
	patch: [],
	remove: []
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
