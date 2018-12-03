const EventEmitter = require('events');
const request = require('request-promise-native');
const config = require('config');

const { courseModel } = require('../services/user-group/model');

class Emitter extends EventEmitter { }
const courseEmitter = new Emitter();

const REQUEST_TIMEOUT = 8000;

const EventMatcher = {

    emit: function (model, action, message, context) {

        console.log('Event to handle:', model, action, message, context);

        // handle events on course
        if (model === 'course' && message && message._id) {
            if (action === 'removed') {
                courseEmitter.emit('removed', message);
            } else {
                courseEmitter.emit('updated', message._id);
            }
        }

        // handle events on lesson
        if (model === 'lesson' && message && message.courseId) {
            courseEmitter.emit('updated', message.courseId);
        }

        // handle events on file
        if (model === 'file' && message && message.path) {
            const regex = /^courses\/([0-9a-f]{24})\//i;
            // path:"courses/5c001d4ad3a4afae89e433d1/"
            const match = message.path.match(regex);
            if (match && match.length === 2) {
                courseEmitter.emit('updated', match[1]);
            }
        }

    }

};

function sendCourseUpdatedPushMessage(course, receivers) {

    if(!receivers) return Promise.reject('receivers missing!');

    // todo retrieve config from app context instead
    const serviceUrls = config.get('services') || {};
    const notification = config.get('notification') || {};

    const data = {
        "notification": {
            "title": `Kurs ${course.name} wurde aktualisiert.`,
            "body": "Neue Inhalte werden automatisch geladen."
        },
        "data": {
            "tag": "course-data-updated",
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
    console.log('course updated event...', courseId);

    // todo get relevant ids of course
    return courseModel.findById(courseId).then(course => {
        if (!course) return Promise.reject('courseId not found');
        let userIds = new Set();
        course.teacherIds.forEach(id => userIds.add(id));
        course.userIds.forEach(id => userIds.add(id));

        // todo send post message
        return sendCourseUpdatedPushMessage(course, [...userIds]);
    }).catch(err => console.log(err));

});

courseEmitter.on('removed', (course) => {

});



module.exports = EventMatcher;
