const exampleResponse = {
	links: {
		self: 'https://schul-cloud.org:3000/events',
	},
	data: [
		{
			type: 'event',
			id: '0ef82d0a-0e20-465d-ae1e-850dc04d9432',
			attributes: {
				summary: 'tttttt',
				location: 'Paul-Gerhardt-Gymnasium',
				description: 'sdds',
				dtstart: '2017-05-19T20:00:00.000Z',
				dtend: '2017-05-19T20:00:00.000Z',
				dtstamp: '2017-05-10T06:44:24.174Z',
				uid: 'e40e1276-4a27-458c-8b64-ae549adadbc2',
			},
			relationships: {
				'scope-ids': ['0000d231816abba584714c9e'],
			},
		},
	],
};

module.exports = (options) => Promise.resolve(exampleResponse);
