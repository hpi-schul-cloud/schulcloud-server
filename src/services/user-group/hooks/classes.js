'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('USERGROUP_VIEW'), restrictToCurrentSchool],
	get: [],
	create: [globalHooks.hasPermission('USERGROUP_CREATE'), restrictToCurrentSchool],
	update: [globalHooks.hasPermission('USERGROUP_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('USERGROUP_EDIT'), restrictToCurrentSchool, globalHooks.permitGroupOperation],
	remove: [globalHooks.hasPermission('USERGROUP_CREATE'), restrictToCurrentSchool, globalHooks.permitGroupOperation]
};

const addDisplayName = (hook) => {
	let data = hook.result.data || hook.result;
    const arrayed = !(Array.isArray(data));
    data = (Array.isArray(data))?(data):([data]);
	
	data = data.map(function (currentClass) {
		if (currentClass.nameFormat = "static") {
			currentClass.displayName = currentClass.name;
		} else if (currentClass.nameFormat = "gradeLevel+name") {
			currentClass.displayName = currentClass.gradeLevel + currentClass.name;
		}
		return currentClass
	})

	if(arrayed){data = data[0];}
    (hook.result.data)?(hook.result.data = data):(hook.result = data);
	return Promise.resolve(hook);	
}

exports.after = {
	all: [],
	find: [addDisplayName],
	get: [
		addDisplayName,
		globalHooks.ifNotLocal(globalHooks.denyIfNotCurrentSchool({errorMessage: 'Die angefragte Gruppe gehört nicht zur eigenen Schule!'})
		
	)],
	create: [],
	update: [],
	patch: [],
	remove: []
};
