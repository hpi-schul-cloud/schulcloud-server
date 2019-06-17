const Role = require('../../../../src/services/role/model');

let createdRoles = [];

const create = async (data) => {
	const role = await Role.create(data);
	createdRoles.push(role._id);
	return role;
};

const cleanup = async () => {
	await Role.deleteMany({ id: { $in: createdRoles } });
	createdRoles = [];
};

module.exports = {
	create,
	cleanup,
	info: () => createdRoles,
};
