const mongoose = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const roleSchema = new Schema({
	name: { type: String, required: true },
	permissions: [{ type: String }],
	roles: [{ type: Schema.Types.ObjectId }],
}, {
	timestamps: true,
});

enableAuditLog(roleSchema);

const RoleModel = mongoose.model('role', roleSchema);

module.exports = {
	RoleModel,
};
