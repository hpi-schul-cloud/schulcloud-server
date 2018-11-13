const fileModel = require('../model');
const { userModel } = require('../../user/model');

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
		if( user.toString() === owner.toString() ) {
			return Promise.resolve(true);
		}
		
		// or legacy course model
		if( refOwnerModel === 'course' ) {
			const userObject = await userModel.findOne({_id: user}).populate('roles').exec();
			const isStudent = userObject.roles.find(role => role.name === 'student');

			if( isStudent ) {
				const rolePermissions = permissions.find(perm => perm.refId.toString() === isStudent._id.toString());
				return rolePermissions[permission] ? Promise.resolve(true) : Promise.reject();
			}
			else {
				return Promise.resolve(true);
			}
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
				return userPermissions[permission] ? resolve(true) : reject();
			}

			const { role } = teamMember;
			const rolePermissions = permissions.find(perm => perm.refId.toString() === role.toString());

			return rolePermissions[permission] ? resolve(true) : reject();
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
