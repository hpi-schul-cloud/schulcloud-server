const mongoose = require('mongoose');

const { Schema } = mongoose;

const roleSchema = new Schema({
	name: { type: String, required: true },
	permissions: [{ type: String }],

	// inheritance
	roles: [{ type: Schema.Types.ObjectId }],
}, {
	timestamps: true,
});

roleSchema.methods.getPermissions = function () {
	return roleModel.resolvePermissions([this._id]);
};

roleSchema.statics.resolvePermissions = function (roleIds) {
	const processedRoleIds = [];
	const permissions = new Set();

	function resolveSubRoles(roleId) {
		return roleModel.findById(roleId)
			.then((role) => {
				if (typeof role !== 'object') {
					role = {};
				}
				if (Array.isArray(role.permissions) === false) {
					role.permissions = [];
				}
				role.permissions.forEach(p => permissions.add(p));
				const promises = role.roles
					.filter(id => !processedRoleIds.includes(id))
					.map((id) => {
						processedRoleIds.push(id);
						return resolveSubRoles(id);	// recursion
					});
				return Promise.all(promises);
			});
	}

	return Promise.all(roleIds.map(id => resolveSubRoles(id)))
		.then(() => permissions);
};

const roleModel = mongoose.model('role', roleSchema);

module.exports = roleModel;
