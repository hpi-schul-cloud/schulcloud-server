const mongoose = require('mongoose');
const leanVirtuals = require('mongoose-lean-virtuals');
const {
	database: { enableAuditLog },
	Cache,
} = require('../../utils');

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

const oneHour = 60 * 60 * 1000;
const cache = new Cache({ name: 'roles', clearInterval: oneHour });

const roleSchema = new Schema(
	{
		name: { type: String, required: true },
		permissions: [{ type: String }],

		// inheritance
		roles: [{ type: Schema.Types.ObjectId }],
	},
	{
		timestamps: true,
	}
);
// https://mongoosejs.com/docs/middleware.html
const mongooseOperationsForClearCache = [
	'findOneAndDelete',
	'findOneAndRemove',
	'findOneAndUpdate',
	'deleteMany',
	'deleteOne',
	'remove',
	'updateOne',
	'updateMany',
];

mongooseOperationsForClearCache.forEach((operation) => {
	roleSchema.post(operation, { query: true, document: true }, () => {
		cache.clear();
	});
});

roleSchema.methods.getPermissions = function getPermissions() {
	return roleModel.resolvePermissions([this._id]); // fixme
};

/**
 * @param {CoreMongooseArray} roleIds
 */
roleSchema.statics.resolvePermissions = function resolvePermissions(roleIds) {
	const processedRoleIds = [];
	const permissions = new Set();
	const cacheIndex = cache.createMongooseIndex(roleIds);

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
	if (cache.get(cacheIndex)) {
		return Promise.resolve(cache.get(cacheIndex));
	}
	const promises = roleIds.map((id) => resolveSubRoles(id));
	return Promise.all(promises).then(() => {
		cache.update(cacheIndex, permissions);
		return permissions;
	});
};

roleSchema.virtual('displayName').get(function get() {
	return rolesDisplayName[this.name] || '';
});

roleSchema.plugin(leanVirtuals);

enableAuditLog(roleSchema);

const roleModel = mongoose.model('role', roleSchema);

module.exports = roleModel;
