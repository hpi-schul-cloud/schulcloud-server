const { RoleModel } = require('../../../../src/services/role/model');

let createdRoles = [];

const create = (app) => async (data = {
	name: `${Date.now()}Test`,
	permissions: [],
}) => {
	const role = await RoleModel.create(data);
	createdRoles.push(role._id);
	// reload cache
	await app.service('roles').init();
	return role;
};

const cleanup = () => {
	if (createdRoles.length === 0) {
		return Promise.resolve();
	}
	const ids = createdRoles;
	createdRoles = [];
	return RoleModel.deleteMany({ _id: { $in: ids } }).lean().exec();
};

module.exports = (app, opt) => ({
	create: create(app),
	cleanup,
	info: () => createdRoles,
});
