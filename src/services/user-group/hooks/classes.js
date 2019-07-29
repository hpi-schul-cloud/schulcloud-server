const auth = require('@feathersjs/authentication');
const { BadRequest } = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const restrictToUsersOwnClasses = globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnClasses);

const validateInput = (context) => {

	if(!(context.data.gradeLevel || (context.data.name && context.data.name.trim())) {
		throw new BadRequest('If grade level is not set, a name have to be');
	}

	return context;
}

const prepareGradeLevelUnset = (context) => {
	if (!context.data.gradeLevel) {
		const unset = context.data.$unset || {};
		unset.gradeLevel = '';
		context.data.$unset = unset;
	}

	return context;
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [
		globalHooks.hasPermission('USERGROUP_VIEW'),
		restrictToCurrentSchool,
		restrictToUsersOwnClasses,
	],
	get: [restrictToUsersOwnClasses],
	create: [globalHooks.hasPermission('USERGROUP_CREATE'), restrictToCurrentSchool],
	update: [globalHooks.hasPermission('USERGROUP_EDIT'), restrictToCurrentSchool, prepareGradeLevelUnset],
	patch: [
		globalHooks.hasPermission('USERGROUP_EDIT'),
		restrictToCurrentSchool,
		globalHooks.permitGroupOperation,
		prepareGradeLevelUnset,
	],
	remove: [globalHooks.hasPermission('USERGROUP_CREATE'), restrictToCurrentSchool, globalHooks.permitGroupOperation],
};

const addDisplayName = (hook) => {
	let data = hook.result.data || hook.result;
	const arrayed = !(Array.isArray(data));
	data = (Array.isArray(data)) ? (data) : ([data]);
	if ((((hook.params.query || {}).$sort || {}).displayName || {}).toString() === '1') {
		data.sort((a, b) => a.displayName.toLowerCase() > b.displayName.toLowerCase());
	} else if ((((hook.params.query || {}).$sort || {}).displayName || {}).toString() === '-1') {
		data.sort((a, b) => a.displayName.toLowerCase() < b.displayName.toLowerCase());
	}

	if (arrayed) {
		data = data[0];
	}
	if (hook.result.data) {
		hook.result.data = data;
	} else {
		(hook.result = data);
	}
	return Promise.resolve(hook);
};

exports.after = {
	all: [],
	find: [addDisplayName],
	get: [
		addDisplayName,
		globalHooks.ifNotLocal(
			globalHooks.denyIfNotCurrentSchool({
				errorMessage: 'Die angefragte Gruppe gehört nicht zur eigenen Schule!',
			}),
		)],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
