'use strict';

// model.js - A mongoose model
// https://www.edu-apps.org/code.html - LTI Parameters
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const homeworkModel = mongoose.model('homework', new Schema({
    schoolId: {type: Schema.Types.ObjectId, required: true},
    createdAt: {type: Date, 'default': Date.now},
    updatedAt: {type: Date, 'default': Date.now},
    name: {type: String, required: true},
    description: {type: String},
    dueDate: {type: Date, required: true},
    availableDate: {type: Date, required: true},
    teacherId: {type: Schema.Types.ObjectId, required: true, ref: 'user'},
    courseId: {type: Schema.Types.ObjectId, 'default': null, ref: 'course'},
    lessonId: {type: Schema.Types.ObjectId, 'default': null, ref: 'lesson'},
    private: {type: Boolean},
    publicSubmissions: {type: Boolean},
    teamSubmissions: {type: Boolean},
    maxTeamMembers: {type: Number, 'default':null, min: 1},
    archived: [{type: Schema.Types.ObjectId, ref: 'user'}]
}));


const submissionModel = mongoose.model('submission', new Schema({
    schoolId: {type: Schema.Types.ObjectId, required: true},
    createdAt: {type: Date, 'default': Date.now},
    updatedAt: {type: Date, 'default': Date.now},
    comment: {type: String},
    grade: {type: Number, min: 0, max: 100},
    gradeComment: {type: String},
    homeworkId: {type: Schema.Types.ObjectId, required: true, ref: 'homework'},
    studentId: {type: Schema.Types.ObjectId, required: true, ref: 'user'},
    teamMembers: [{type: Schema.Types.ObjectId, required: true, ref: 'user'}],
    courseGroup: {type: Schema.Types.ObjectId, ref: 'courseGroup'},
    fileIds: [{type: Schema.Types.ObjectId, ref: 'file'}],
    comments: [{type: Schema.Types.ObjectId, ref: 'comment'}]
}));


const commentModel = mongoose.model('comment', new Schema({
    comment: {type: String, required: true},
    submissionId: {type: Schema.Types.ObjectId, required: true, ref: 'submission'},
    createdAt: {type: Date, 'default': Date.now},
    author: {type: Schema.Types.ObjectId, required: true, ref: 'user'}
}));

module.exports = {
    homeworkModel,
    submissionModel,
    commentModel
};
