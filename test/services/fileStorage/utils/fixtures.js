module.exports = {
	users: [
		{
			_id: '0000d224816abba584714c8c',
			email: 'max@mustermann.de',
			firstName: 'Max',
			lastName: 'Musterschueler',
			roles: ['0000d186816abba584714c98'],
		},
		{
			_id: '0000d224816abba584714c8d',
			email: 'max@mustermann.de',
			firstName: 'Peter',
			lastName: 'Musterschueler',
			roles: ['0000d186816abba584714c98'],
		},
		{
			_id: '0000d224816abba584714c8e',
			email: 'max@mustermann.de',
			firstName: 'Max',
			lastName: 'Musterlehrer',
			roles: ['0000d186816abba584714c99'],
		}
	],
	roles: [
		{
			_id: '0000d186816abba584714c98',
			name: 'student'
		},
		{
			_id: '0000d186816abba584714c99',
			name: 'teacher'
		},
	],
	courses: [
		{
			_id: '0000dcfbfb5c7a3f00bf21ac',
			name: 'Test-Kurs',
			schoolId: '0000d186816abba584714c5e',
			teacherIds: ['0000d224816abba584714c8e'],
			userIds: ['0000d224816abba584714c8c'],
			ltiToolIds: ['59a55f39a2049554a93fed16'],
			substitutionIds: ['59ad4c412b442b7f81810285'],
			color: '#ACACAC',
		}
	],
	files: [
		{
			_id: '5ca601745d629505e51252d7',
			owner: '0000d224816abba584714c8c',
			refOwnerModel: 'user',
			permissions: [],
			isDirectory: false,
		},
		{
			_id: '5ca613c4c7f5120b8c5bef27',
			owner: '0000d231816abba584714c9e',
			refOwnerModel: 'user',
			permissions: [
				{
					refId: '0000d224816abba584714c8c',
					refPermModel: 'user',
					read: true,
				},
			],
			isDirectory: false,
		},
		{
			_id: '5ca613c4c7f5120b8c5bef28',
			owner: '0000dcfbfb5c7a3f00bf21ac',
			refOwnerModel: 'course',
			permissions: [
				{
					refId: '0000d186816abba584714c98',
					refPermModel: 'role',
					read: true,
					delete: true,
					write: true,
					create: true,
				},
			],
			isDirectory: false,
		},
	]
};
