const { Schema, model } = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const yearSchema = new Schema({
    name: {
        type: String,
        required: true,
        match: /^[0-9]{4}\/[0-9]{2}$/,
        unique: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
});

enableAuditLog(yearSchema);
module.exports.yearModel = model('year', yearSchema);