const fileModel = require('../model');

const getFile = (id) => {
	return fileModel
		.findOne({ _id: id })
		.populate('owner')
		.exec();
};

const checkPermissions = (permission) => {
	return async (user, file) => {		
		const fileObject = await getFile(file);
		const {
			permissions,
			refOwnerModel,
			owner: { _id: owner }
		} = fileObject;
		
		// return always true for owner of file
		// or legacy course model
		if( user.toString() === owner.toString() || refOwnerModel === 'course' ) {
			return Promise.resolve();
		}
		
		const teamMember = fileObject.owner.userIds.find(_ => _.userId.toString() === user.toString());
		const userPermissions = permissions.find(perm => perm.refId.toString() === user.toString());
		
		// User is either not member of Team
		// or file has no explicit user permissions (sharednetz files)
		if(!teamMember && !userPermissions) {			
			return Promise.reject();
		}

		return new Promise((resolve, reject) => {

			if( userPermissions ) {
				return userPermissions[permission] ? resolve() : reject();
			}

			const { role } = teamMember;
			const rolePermissions = permissions.find(perm => perm.refId === role);

			return rolePermissions[permission] ? resolve() : reject();
		});
	};
};

module.exports = {
	checkPermissions,
	canWrite: checkPermissions('write'),
	canRead: checkPermissions('read'),
	canCreate: checkPermissions('create'),
	canDelete: checkPermissions('delete'),
};
