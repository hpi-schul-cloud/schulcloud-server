const config = require('config');
const request = require('request-promise-native');

const Emitter = require('./emitter');
const { courseModel } = require('../services/user-group/model');

const courseEmitter = new Emitter();
const REQUEST_TIMEOUT = 8000;

const winston = require('winston');

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

function sendCourseUpdatedPushMessage(course, receivers, tag) {

    if (!receivers) return Promise.reject('receivers missing!');

    // todo retrieve config from app context instead
    const serviceUrls = config.get('services') || {};
    const notification = config.get('notification') || {};

    const data = {
        "notification": {
            "title": `Kurs ${course.name} wurde aktualisiert.`,
            "body": "Neue Inhalte werden automatisch geladen."
        },
        "data": {
            "tag": tag,
            "courseId": course._id,
        },
        "receivers": receivers,
        "template": "tpl",
        "languagePayloads": "lp"
    };

    const options = {
        uri: serviceUrls.notification + '/push/',
        method: 'POST',
        headers: {
            //'token': userId
        },
        body: Object.assign({}, data,
            { serviceUrl: serviceUrls.notification },
            { platformId: notification.platformId }
        ),
        json: true,
        timeout: REQUEST_TIMEOUT
    };

    return request(options).then(response => {
        return response;
    });
}

courseEmitter.on('updated', (courseId) => {
    logger.info('course updated event...', courseId);

    return courseModel.findById(courseId).then(course => {
        if (!course) return Promise.reject('courseId not found');
        let userIds = new Set();
        course.teacherIds.forEach(id => userIds.add(id));
        course.userIds.forEach(id => userIds.add(id));
        course.substitutionIds.forEach(id => userIds.add(id));

        // todo send post message
        return sendCourseUpdatedPushMessage(course, [...userIds], 'course-data-updated');
    }).catch(err => logger.info(err));

});

courseEmitter.on('removed', (course) => {
    logger.info('course removed event...', course);

    let userIds = new Set();
    course.teacherIds.forEach(id => userIds.add(id));
    course.userIds.forEach(id => userIds.add(id));
    course.substitutionIds.forEach(id => userIds.add(id));

    return sendCourseUpdatedPushMessage(course, [...userIds], 'course-removed');

});

module.exports = courseEmitter;
