'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

/**
 *
 * @param weekdayNum {number}
 * @returns {string} - abbreviation of weekday
 */
const getWeekdayForNumber = (weekdayNum) => {
	let weekdayNames = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
	return weekdayNames[weekdayNum];
};

/**
 * creates an event for a created course. following params has to be included in @param hook for creating the event:
 * startDate {Date} - the date the course is first take place
 * untilDate {Date} -  the date the course is last take place
 * duration {Number} - the duration of a course lesson
 * weekday {Number} - from 1 to 7, the weekday the course take place
 * @param hook
 */
const createEventsForCourse = (hook) => {
	let course = hook.result;
	let calendarService = hook.app.service("calendar");
	return Promise.all(course.times.map(time => {
		return calendarService.create({
			summary: course.name,
			location: "HPI", // todo: school name?
			description: course.description,
			startDate: time.startDate,
			duration: time.duration,
			repeat_until: time.untilDate,
			frequency: "WEEKLY",
			weekday: getWeekdayForNumber(time.weekday)
		})
	}))
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
