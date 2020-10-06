const mongoose = require('mongoose');
const leanVirtuals = require('mongoose-lean-virtuals');
const { enableAuditLog } = require('../../utils/database');
const logger = require('../../logger');

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

let cache = {};
// let count = 0;

const clearCache = () => {
	logger.info('Clear role cache');
	cache = {};
};

const updateCache = (id, data) => {
	// validate?
	logger.info(`Update role cache${id}`, data);
	cache[id] = data;
};

const getFromCache = (id) => {
	return cache[id];
};

const createCacheIndex = (coreMongooseArray) => {
	let index = '';
	coreMongooseArray.forEach((id) => {
		index += id;
	});
	return index;
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
	}
);

// TODO: clearCache() for every update, patch, findOneAndUpdate and so on mongoose operations

roleSchema.methods.getPermissions = function getPermissions() {
	return roleModel.resolvePermissions([this._id]); // fixme
};

/**
 * @param {CoreMongooseArray} roleIds
 */
roleSchema.statics.resolvePermissions = function resolvePermissions(roleIds) {
	const processedRoleIds = [];
	const permissions = new Set();
	const cacheIndex = createCacheIndex(roleIds);

	function resolveSubRoles(roleId) {
		// count += 1;
		// logger.info(count, roleId);
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
	if (getFromCache(cacheIndex)) {
		return Promise.resolve(getFromCache(cacheIndex));
	}
	const promises = roleIds.map((id) => resolveSubRoles(id));
	return Promise.all(promises).then(() => {
		updateCache(cacheIndex, permissions);
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
