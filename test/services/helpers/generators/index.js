const Users = require('./Users');
const Accounts = require('./Accounts');
const Classes = require('./Classes');
const Schools = require('./Schools');
const Roles = require('./Roles');
const Systems = require('./Systems');
const Homeworks = require('./Homeworks');
const Courses = require('./Courses');
const Submissions = require('./Submissions');
const Lessons = require('./Lessons');
const RegistrationPins = require('./RegistrationPins');

module.exports = {
    Users,
    Accounts,
    Classes,
    Schools,
    Roles,
    Systems,
    Homeworks,
    Courses,
    Submissions,
    Lessons,
    RegistrationPins,
};

module.exports.Consents = (app) => {
    class GenericGenerator extends require('./AbstractGenerator') {
        constructor(app) {
            super(app);
            this._service = app.service('consents');
        }
    }

    return new GenericGenerator(app);
};