const courseEmitter = require('./courseEmitter');


// todo launch here for events using functions like
// this.app.service('users').on('removed', this._onUserRemoved.bind(this));


const EventMatcher = {

	emit(model, action, message, context) {
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
	},

};

module.exports = EventMatcher;
