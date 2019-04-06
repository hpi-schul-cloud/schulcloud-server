const service = require('feathers-mongoose');
const rp = require('request-promise-native');
const timeline = require('./timeline-model');
const hooks = require('./hooks/index');

class TimelineFetchService {
	get(_id) {
		// get url to fetch from database
		return timeline.find({
			_id,
		}).then((data) => {
			const timelineData = data[0];
			if (!timelineData) {
				throw new Error(`Can't find timeline with id: ${_id}`);
			}

			// fetch new data
			const options = {
				uri: timelineData.fetchUrl,
				headers: {
					'User-Agent': 'Request-Promise',
				},
				json: false,
			};
			return rp(options).then((newTimelineData) => {
				// update database
				timeline.update(
					{ _id },
					{ $set: { json: newTimelineData } },
				);
			}).catch(() => {
				throw new Error(`Can't receive data from ${timelineData.fetchUrl}`);
			});
		});
	}
}

// eslint-disable-next-line func-names
module.exports = function () {
	const app = this;

	const options = {
		Model: timeline,
		paginate: {
			default: 1,
			max: 1000,
		},
		lean: true,
	};

	// Initialize our service with any options it requires
	app.use('/timelines/fetch', new TimelineFetchService());
	app.use('/timelines', service(options));

	// Get our initialize service to that we can bind hooks
	const timelineFetchService = app.service('/timelines/fetch');
	const timelineService = app.service('/timelines');

	// Set up our before hooks
	timelineService.before(hooks.before(''));
	timelineFetchService.before(hooks.before('timelineFetch'));

	// Set up our after hooks
	timelineService.after(hooks.after);
	timelineFetchService.after(hooks.after);
};
