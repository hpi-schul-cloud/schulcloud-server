'use strict';

const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const restrictToUsersOwnClasses = globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnClasses);

const populateGradeLevel = (hook) => {
	// Add populate to query to be able to show year in displayName
	if((hook.params.query||{})['$populate']){
		if(!hook.params.query['$populate'].includes('gradeLevel')){
			hook.params.query['$populate'].push('gradeLevel');
		}
	}else{
		if(!hook.params.query){
			hook.params.query = {};
		}
		hook.params.query['$populate'] = ['gradeLevel'];
	}
	return Promise.resolve(hook);
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('USERGROUP_VIEW'), restrictToCurrentSchool, restrictToUsersOwnClasses, populateGradeLevel],
	get: [restrictToUsersOwnClasses, populateGradeLevel],
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
		if (currentClass.nameFormat == "static") {
			currentClass.displayName = currentClass.name;
		} else if (currentClass.nameFormat == "gradeLevel+name") {
			currentClass.displayName = `${currentClass.gradeLevel.name}${currentClass.name}`;
		}
		return currentClass;
	});
	if (((hook.params.query||{})['$sort']||{}).displayName == 1) {
		data.sort((a, b) => {
			return a.displayName.toLowerCase() > b.displayName.toLowerCase();
		});
	} else if (((hook.params.query||{})['$sort']||{}).displayName == -1) {
		data.sort((a, b) => {
			return a.displayName.toLowerCase() < b.displayName.toLowerCase();
		});
	}

	if(arrayed){data = data[0];}
    (hook.result.data)?(hook.result.data = data):(hook.result = data);
	return Promise.resolve(hook);	
};

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
