module.exports = {
	/** populate school name, creator/updater name and target name */
	populateProperties: [
		{ path: 'schoolId', select: ['_id', 'name'] },
		{ path: 'creatorId', select: ['_id', 'firstName', 'lastName'] },
		{ path: 'updaterId', select: ['_id', 'firstName', 'lastName'] },
		{ path: 'target', select: ['_id', 'name'] },
	],
};
