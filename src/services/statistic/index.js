const moment = require('moment');
const _ = require('lodash');
const hooks = require('./hooks/index');
const swaggerDocs = require('./docs/');
const schoolModel = require('../school/model');
const userModel = require('../user/model');
const accountModel = require('../account/model');
const homeworkModel = require('../homework/model');
const lessonModel = require('../lesson/model');
const groupModel = require('../user-group/model');
const { FileModel } = require('../fileStorage/model');

const promises = [
    {
        name: 'users',
        promise: userModel.userModel.count().exec(),
        model: userModel.userModel.find().exec(),
    },
    {
        name: 'schools',
        promise: schoolModel.schoolModel.count().exec(),
        model: schoolModel.schoolModel.find().exec(),
    },
    {
        name: 'accounts',
        promise: accountModel.count().exec(),
        model: accountModel.find().exec(),
    },
    {
        name: 'homework',
        promise: homeworkModel.homeworkModel.count().exec(),
        model: homeworkModel.homeworkModel.find().exec(),
    },
    {
        name: 'submissions',
        promise: homeworkModel.submissionModel.count().exec(),
        model: homeworkModel.submissionModel.find().exec(),
    },
    {
        name: 'comments',
        promise: homeworkModel.commentModel.count().exec(),
        model: homeworkModel.commentModel.find().exec(),
    },
    {
        name: 'lessons',
        promise: lessonModel.count().exec(),
        model: lessonModel.find().exec(),
    },
    {
        name: 'classes',
        promise: groupModel.classModel.count().exec(),
        model: groupModel.classModel.find().exec(),
    },
    {
        name: 'courses',
        promise: groupModel.courseModel.count().exec(),
        model: groupModel.courseModel.find().exec(),
    },
    {
        name: 'teachers',
        promise: userModel.userModel.count({ roles: '0000d186816abba584714c98' }).exec(),
        model: userModel.userModel.find({ roles: '0000d186816abba584714c98' }).exec(),
    },
    {
        name: 'students',
        promise: userModel.userModel.count({ roles: '0000d186816abba584714c99' }).exec(),
        model: userModel.userModel.find({ roles: '0000d186816abba584714c99' }).exec(),
    },
    {
        name: 'files/directories',
        promise: FileModel.count().exec(),
        model: FileModel.find().exec(),
    },
];

const fetchStatistics = () => {
    const statistics = {};

    return Promise.all(promises.map(p => p.promise.then((res) => {
        statistics[p.name] = res;
        return res;
    }))).then(_ => statistics);
};

class StatisticsService {
    constructor() {
        this.docs = swaggerDocs.statisticsService;
    }

    find({ query, payload }) {
        return fetchStatistics()
            .then(statistics => statistics);
    }

    get(id, params) {
        return _.find(promises, { name: id }).model
            .then((generic) => {
                const stats =   generic.map(gen => moment(gen.createdAt).format('YYYY-MM-DD'));

                const counts = {};
                stats.forEach((x) => { counts[x] = (counts[x] || 0) + 1; });

                const ordered = {};
                Object.keys(counts).sort().forEach((key) => {
                    ordered[key] = counts[key];
                });

                const x = [];
                const y = [];

                if (params.query.returnArray) {
                    for (const key in ordered) {
                        if (ordered.hasOwnProperty(key)) {
                            x.push(key);
                            y.push(ordered[key]);
                        }
                    }
                }

                return (params.query.returnArray) ? { x, y } : ordered;
            });
    }
}

module.exports = function () {
    const app = this;

    app.use('/statistics', new StatisticsService());
    const statisticsService = app.service('/statistics');
    statisticsService.hooks(hooks);
};
