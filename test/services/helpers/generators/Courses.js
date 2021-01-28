const AbstractGenerator = require('./AbstractGenerator');

class Courses extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('courses');
    }

    async create({
                     // required fields for base group
                     name = 'testCourse',
                     description = 'testCourseDescription',
                     userIds = [],
                     classIds = [],
                     teacherIds = [],
                     ltiToolIds = [],
                     substitutionIds = [],
                     features = [],
                     startDate,
                     untilDate,
                     schoolId,
                 }) {
        const result = await this._service.create({
            // required fields for course
            name,
            description,
            userIds,
            classIds,
            teacherIds,
            ltiToolIds,
            substitutionIds,
            features,
            startDate,
            untilDate,
            schoolId,
        });
        this._createdEntitiesIds.push(result._id.toString());
        return result;
    }
}

Object.freeze(Courses);
module.exports = Courses;