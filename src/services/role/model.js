const mongoose = require('mongoose');
const leanVirtuals = require('mongoose-lean-virtuals');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const rolesDisplayName = {
	teacher: 'Lehrer',
	student: 'Schüler',
	administrator: 'Administrator',
	superhero: 'Schul-Cloud Admin',
	demo: 'Demo',
	demoTeacher: 'Demo',
	demoStudent: 'Demo',
	helpdesk: 'Helpdesk',
	betaTeacher: 'Beta',
	expert: 'Experte',
};

const roleSchema = new Schema(
	{
		name: { type: String, required: true },
		permissions: [{ type: String }],

		// inheritance
		roles: [{ type: Schema.Types.ObjectId }],
	},
	{
		timestamps: true,
	},
);

roleSchema.methods.getPermissions = function getPermissions() {
	return roleModel.resolvePermissions([this._id]); // fixme
};

roleSchema.statics.resolvePermissions = function resolvePermissions(roleIds) {
	const processedRoleIds = [];
	const permissions = new Set();

	function resolveSubRoles(roleId) {
		return roleModel
			.findById(roleId) // fixme
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

	return Promise.all(roleIds.map((id) => resolveSubRoles(id))).then(
		() => permissions,
	);
};

roleSchema.virtual('displayName').get(function get() {
	return rolesDisplayName[this.name] || '';
});

roleSchema.plugin(leanVirtuals);

enableAuditLog(roleSchema);

const roleModel = mongoose.model('role', roleSchema);

module.exports = roleModel;
