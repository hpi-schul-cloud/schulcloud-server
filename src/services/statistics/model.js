'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StatisticsSchema = new Schema({

    createdAt: { type: Date, 'default': Date.now },

    firstPaint: { type: Number, 'default': 0 },
    timeToInteractive: { type: Number, 'default': 0 },
    pageLoaded: { type: Number, 'default': 0 },
    domInteractiveTime: { type: Number, 'default': 0 },
    domContentLoaded: { type: Number, 'default': 0 },

    downlink: { type: Number, 'default': 0 },
    connection: { type: String, required: false },
    path: { type: String, required: true },
    dl: { type: String, required: true },
    qt: { type: Number, 'default': 0 },
    cid: { type: String, required: true }

});

module.exports = mongoose.model('Statistics', StatisticsSchema);
