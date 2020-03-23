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

const roleSchema = new Schema({
	name: { type: String, required: true },
	permissions: [{ type: String }],
	roles: [{ type: Schema.Types.ObjectId }],
}, {
	timestamps: true,
});

/* roleSchema.virtual('displayName').get(function get() {
	return rolesDisplayName[this.name] || '';
});
*/
//roleSchema.plugin(leanVirtuals);

enableAuditLog(roleSchema);

const RoleModel = mongoose.model('role', roleSchema);

module.exports = {
	RoleModel,
	rolesDisplayName,
};
