'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

/**
 * creates an event for a created course. following params has to be included in @param hook for creating the event:
 * startDate {Date} - the date the course is first take place
 * untilDate {Date} -  the date the course is last take place
 * duration {Number} - the duration of a course lesson
 * weekday {Number} - from 1 to 7, the weekday the course take place
 * @param hook
 */
const createEventsForCourse = (hook) => {

};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [createEventsForCourse],
	update: [],
	patch: [],
	remove: []
};
