const exampleResponse = {
	data: {
		type: 'messages',
		id: '59199dbe8d4be221143cc866',
		attributes: {
			title: 'New Notification from Teacher1_1',
			body: 'You have a new Notification',
			priority: 'medium',
			'created-at': '2017-05-15T12:23:26.017Z',
		},
	},
};

module.exports = (options) => Promise.resolve(exampleResponse);
