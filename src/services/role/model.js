const mongoose = require('mongoose');

const { Schema } = mongoose;

const roleSchema = new Schema({
	name: { type: String, required: true },
	permissions: [{ type: String }],
	roles: [{ type: Schema.Types.ObjectId }],
}, {
	timestamps: true,
});

const RoleModel = mongoose.model('role', roleSchema);

module.exports = {
	RoleModel,
};
