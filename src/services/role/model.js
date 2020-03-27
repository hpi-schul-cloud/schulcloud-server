const mongoose = require('mongoose');
const leanVirtuals = require('mongoose-lean-virtuals');
const { rolesDisplayName } = require('./statics');

const { Schema } = mongoose;

const roleSchema = new Schema({
	name: { type: String, required: true },
	permissions: [{ type: String }],

	// inheritance
	roles: [{ type: Schema.Types.ObjectId }],
}, {
	timestamps: true,
});

roleSchema.methods.getPermissions = function getPermissions() {
	return RoleModel.resolvePermissions([this._id]); // fixme
};

roleSchema.statics.resolvePermissions = function resolvePermissions(roleIds) {
	const processedRoleIds = [];
	const permissions = new Set();

	function resolveSubRoles(roleId) {
		return RoleModel.findById(roleId) // fixme
			.then((role) => {
				if (typeof role !== 'object') {
					role = {};
				}
				if (Array.isArray(role.permissions) === false) {
					role.permissions = [];
				}
				role.permissions.forEach((p) => permissions.add(p));
				const promises = role.roles
					.filter((id) => !processedRoleIds.includes(id))
					.map((id) => {
						processedRoleIds.push(id);
						return resolveSubRoles(id); // recursion
					});
				return Promise.all(promises);
			});
	}

	return Promise.all(roleIds.map((id) => resolveSubRoles(id)))
		.then(() => permissions);
};

roleSchema.virtual('displayName').get(function get() {
	return rolesDisplayName[this.name] || '';
});

roleSchema.plugin(leanVirtuals);

const RoleModel = mongoose.model('role', roleSchema);

module.exports = {
	RoleModel,
};
