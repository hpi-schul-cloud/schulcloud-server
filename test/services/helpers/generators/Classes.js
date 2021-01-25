const AbstractGenerator = require('./AbstractGenerator');

class Classes extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('classes');
    }

    async create({
                     // required fields
                     name = 'testClass',
                     userIds = [],
                     teacherIds = [],
                     nameFormat = 'static',
                     gradeLevel = undefined,
                     year = undefined,
                     predecessor = undefined,
                     ...otherParams
                 }) {
        const result = await this._service.create({
            name,
            userIds,
            teacherIds,
            nameFormat,
            gradeLevel,
            year,
            predecessor,
            ...otherParams
        });
        this._createdEntitiesIds.push(result._id.toString());
        return result;
    }
}

Object.freeze(Classes);
module.exports = Classes;