module.exports = {
	calendar: {
			description: 'A proxy-service to handle the standalone schul-cloud calendar service ',
			create: {
				parameters: [
					{
						description: 'the title or summary of a event',
						name: 'summary',
						type: 'string'
					},
					{
						description: 'the location of a event',
						name: 'location',
						type: 'string'
					},
					{
						description: 'the description of a event',
						name: 'description',
						type: 'string'
					},
					{
						description: 'the startDate of a event',
						name: 'startDate',
						type: 'date'
					},
					{
						description: 'the endDate of a event',
						name: 'endDate',
						type: 'date'
					},
					{
						description: 'the duration of a event',
						name: 'duration',
						type: 'number'
					},
					{
						description: 'the frequency of a event',
						name: 'frequency',
						type: 'string'
					},
					{
						description: 'the weekday of a event',
						name: 'weekday',
						type: 'string'
					},
					{
						description: 'the repeat_until of a event',
						name: 'repeat_until',
						type: 'date'
					},
					{
						description: 'the course reference of a event, e.g. for linking to a course page',
						name: 'courseId',
						type: 'string'
					},
					{
						description: 'the course-time reference of a event, e.g. for linking to a specific course-time',
						name: 'courseTimeId',
						type: 'string'
					},
					{
						description: 'the scope reference of a event',
						name: 'scopeId',
						type: 'string'
					}

				],
				summary: 'Creates a new event for the given scope'
			},
			find: {
				parameters: [
					{
						description: 'a valid user id',
						required: true,
						name: 'userId',
						type: 'string'
					}
				],
				summary: 'Gets all events for a given user'
			},
			remove: {
				parameters: [
					{
						description: 'a valid event id',
						required: true,
						in: "path",
						name: 'id',
						type: 'string'
					}
				],
				summary: 'Deletes a event from the calendar-service'
			},
			update: {
				parameters: [
					{
						description: 'a valid event id',
						required: true,
						in: "path",
						name: 'id',
						type: 'string'
					}
				],
				summary: 'Updates a event from the calendar-service'
			}
	},
	subscription:{
		description:'A proxy-service to handle the subscriptions for the standalone schul-cloud calendar service.',
		create:{parameters: [{}],summary:''},
		remove:{parameters: [{}],summary:''},
		update:{parameters: [{}],summary:''}
	}
}