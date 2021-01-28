const AbstractGenerator = require('./AbstractGenerator');

class Lessons extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('lessons');
    }

    async create({
                     name = 'testLesson',
                     description = 'lorem ipsum',
                     courseId = undefined,
                     courseGroupId = undefined,
                     contents = [],
                     date = undefined,
                     time = undefined,
                     hidden = undefined,
                     ...otherParams
                 } = {}, params) {
        return super.create({
            name,
            description,
            courseId,
            courseGroupId,
            contents,
            date,
            time,
            hidden,
            ...otherParams
        }, params);
    }
}

Object.freeze(Lessons);
module.exports = Lessons;