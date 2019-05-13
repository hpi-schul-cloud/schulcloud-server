const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const restrictToUsersOwnClasses = globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnClasses);

const populateGradeLevel = (hook) => {
	// Add populate to query to be able to show year in displayName
	if ((hook.params.query || {}).$populate) {
		if (!hook.params.query.$populate.includes('gradeLevel')) {
			hook.params.query.$populate.push('gradeLevel');
		}
	} else {
		if (!hook.params.query) {
			hook.params.query = {};
		}
		hook.params.query.$populate = ['gradeLevel'];
	}
	return Promise.resolve(hook);
};

exports.before = {
	all: [globalHooks.authenticateJWT],
	find: [
		globalHooks.hasPermission('USERGROUP_VIEW'),
		restrictToCurrentSchool,
		restrictToUsersOwnClasses,
		populateGradeLevel,
	],
	get: [restrictToUsersOwnClasses, populateGradeLevel],
	create: [globalHooks.hasPermission('USERGROUP_CREATE'), restrictToCurrentSchool],
	update: [globalHooks.hasPermission('USERGROUP_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('USERGROUP_EDIT'), restrictToCurrentSchool, globalHooks.permitGroupOperation],
	remove: [globalHooks.hasPermission('USERGROUP_CREATE'), restrictToCurrentSchool, globalHooks.permitGroupOperation],
};

const addDisplayName = (hook) => {
	let data = hook.result.data || hook.result;
	const arrayed = !(Array.isArray(data));
	data = (Array.isArray(data)) ? (data) : ([data]);
	if (((hook.params.query || {}).$sort || {}).displayName === 1) {
		data.sort((a, b) => a.displayName.toLowerCase() > b.displayName.toLowerCase());
	} else if (((hook.params.query || {}).$sort || {}).displayName === -1) {
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
