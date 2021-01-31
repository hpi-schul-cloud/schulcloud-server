const { Schema, model } = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const gradeLevelSchema = new Schema({
    name: { type: String, required: true },
});

enableAuditLog(gradeLevelSchema);
module.exports.gradeLevelModel = model('gradeLevel', gradeLevelSchema);