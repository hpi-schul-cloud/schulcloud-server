const { RoleModel } = require('../../../../src/services/role/model');

let createdRoles = [];

const create = async (data) => {
	const role = await RoleModel.create(data);
	createdRoles.push(role._id);
	return role;
};

const cleanup = () => {
	if (createdRoles.length === 0) {
		return Promise.resolve();
	}
	const ids = createdRoles;
	createdRoles = [];
	return RoleModel.deleteMany({ id: { $in: ids } });
};

module.exports = {
	create,
	cleanup,
	info: () => createdRoles,
};
