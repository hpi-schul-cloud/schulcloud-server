module.exports = {
	/** populate school name, creator/updater name and target name */
	populateProperties: [
		{ path: 'schoolId', select: ['_id', 'name'], target: 'school' },
		{ path: 'creatorId', select: ['_id', 'firstName', 'lastName'], target: 'creator' },
		{ path: 'updaterId', select: ['_id', 'firstName', 'lastName'], target: 'updater' },
		{ path: 'target', select: ['_id', 'name'] },
	],
};
