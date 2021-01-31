const { Schema, model } = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const schoolGroupSchema = new Schema(
        {
            name: { type: String, required: true },
        },
        { timestamps: true }
);

enableAuditLog(schoolGroupSchema);
module.exports.schoolGroupModel = model('schoolGroup', schoolGroupSchema);