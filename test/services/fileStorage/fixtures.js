const mongoose = require('mongoose');

const teamRoles = [
	{
		_id: mongoose.mongo.ObjectId('6bb5c190fb457b1c3c0c7e0f'),
		name: 'teammember',
		roles: [],
	},
	{
		_id: mongoose.mongo.ObjectId('6bb5c391fb457b1c3c0c7e10'),
		name: 'teamexpert',
		roles: [],
	},
	{
		_id: mongoose.mongo.ObjectId('6bb5c49efb457b1c3c0c7e11'),
		name: 'teamleader',
		roles: ['6bb5c190fb457b1c3c0c7e0f'],
	},
	{
		_id: mongoose.mongo.ObjectId('6bb5c545fb457b1c3c0c7e13'),
		name: 'teamadministrator',
		roles: ['6bb5c49efb457b1c3c0c7e11'],
	},
	{
		_id: mongoose.mongo.ObjectId('6bb5c62bfb457b1c3c0c7e14'),
		name: 'teamowner',
		roles: ['6bb5c545fb457b1c3c0c7e13'],
	},
];

module.exports = {
	schools: [
		{
			_id: mongoose.mongo.ObjectId('0000e186816abba584714c55'),
			name: 'testschule',
			fileStorageType: 'awsS3',
		},
	],
	users: [
		{
			_id: mongoose.mongo.ObjectId('0000d224816abba584714c8c'),
			email: 'max@mustermann.de',
			schoolId: '0000e186816abba584714c55',
			firstName: 'Max',
			lastName: 'Musterschueler',
			roles: ['0000d186816aaaa584714c98'],
		},
		{
			_id: mongoose.mongo.ObjectId('0000d224816abba584714c8d'),
			email: 'max@mustermann.de',
			schoolId: '0000e186816abba584714c55',
			firstName: 'Peter',
			lastName: 'Musterschueler',
			roles: ['0000d186816aaaa584714c98'],
		},
		{
			_id: mongoose.mongo.ObjectId('0000d224816abba584714c8e'),
			email: 'max@mustermann.de',
			schoolId: '0000e186816abba584714c55',
			firstName: 'Max',
			lastName: 'Musterlehrer',
			roles: ['0000d186816aaaa584714c99'],
		},
	],
	roles: [
		{
			_id: mongoose.mongo.ObjectId('0000d186816aaaa584714c98'),
			name: 'student',
		},
		{
			_id: mongoose.mongo.ObjectId('0000d186816aaaa584714c99'),
			name: 'teacher',
		},
		...teamRoles,
	],
	courses: [
		{
			_id: mongoose.mongo.ObjectId('0000dcfbfb5c7a3f00bf21ac'),
			name: 'Test-Kurs',
			schoolId: '0000e186816abba584714c55',
			teacherIds: ['0000d224816abba584714c8e'],
			userIds: ['0000d224816abba584714c8c'],
			ltiToolIds: ['59a55f39a2049554a93fed16'],
			substitutionIds: ['59ad4c412b442b7f81810285'],
			color: '#ACACAC',
		},
	],
	teams: [
		{
			_id: mongoose.mongo.ObjectId('5cf9303bec9d6ac639fefd42'),
			schoolId: '0000e186816abba584714c55',
			schoolIds: ['0000e186816abba584714c55'],
			name: 'Testteam',
			invitedUserIds: [],
			times: [],
			filePermission: [
				{
					write: false,
					read: false,
					create: false,
					delete: false,
					refId: '6bb5c190fb457b1c3c0c7e0f',
					refPermModel: 'role',
				},
				{
					write: false,
					read: false,
					create: false,
					delete: false,
					refId: '6bb5c391fb457b1c3c0c7e10',
					refPermModel: 'role',
				},
			],
			userIds: [
				{
					userId: '0000d224816abba584714c8e',
					role: '6bb5c62bfb457b1c3c0c7e14',
					schoolId: '0000e186816abba584714c55',
				},
				{
					userId: '0000d224816abba584714c8c',
					role: '6bb5c190fb457b1c3c0c7e0f',
					schoolId: '0000e186816abba584714c55',
				},
			],
		},
	],
	files: [
		{
			_id: mongoose.mongo.ObjectId('5ca601745d629505e51252d7'),
			owner: mongoose.mongo.ObjectId('0000d224816abba584714c8c'),
			refOwnerModel: 'user',
			permissions: [],
			isDirectory: false,
		},
		{
			_id: mongoose.mongo.ObjectId('5ca613c4c7f5120b8c5bef27'),
			owner: mongoose.mongo.ObjectId('0000d231816abba584714c9e'),
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
			_id: mongoose.mongo.ObjectId('5ca613c4c7f5120b8c5bef28'),
			owner: mongoose.mongo.ObjectId('0000dcfbfb5c7a3f00bf21ac'),
			refOwnerModel: 'course',
			permissions: [
				{
					refId: '0000d186816aaaa584714c98',
					refPermModel: 'role',
					read: true,
					delete: true,
					write: true,
					create: true,
				},
			],
			isDirectory: false,
		},
		{
			_id: mongoose.mongo.ObjectId('5ca613c4c7f5120b8c5bef29'),
			owner: mongoose.mongo.ObjectId('5cf9303bec9d6ac639fefd42'),
			refOwnerModel: 'teams',
			permissions: teamRoles.map(({ refId }) => ({
				refId,
				refPermModel: 'role',
				read: true,
				delete: true,
				write: true,
				create: true,
			})),
			isDirectory: false,
		},
		{
			_id: mongoose.mongo.ObjectId('5ca613c4c7f5120b8c5bef30'),
			owner: mongoose.mongo.ObjectId('5cf9303bec9d6ac639fefd42'),
			refOwnerModel: 'teams',
			permissions: teamRoles.map(({ refId }) => ({
				refId,
				refPermModel: 'role',
				read: true,
				delete: true,
				write: true,
				create: true,
			})),
			isDirectory: false,
		},
		{
			_id: mongoose.mongo.ObjectId('5ca613c4c7f5120b8c5bef31'),
			owner: mongoose.mongo.ObjectId('5cf9303bec9d6ac639fefd42'),
			parent: '5ca613c4c7f5120b8c5bef33',
			refOwnerModel: 'teams',
			permissions: teamRoles.map(({ refId }) => ({
				refId,
				refPermModel: 'role',
				read: true,
				delete: true,
				write: true,
				create: true,
			})),
			isDirectory: false,
		},
		{
			_id: mongoose.mongo.ObjectId('5ca613c4c7f5120b8c5bef32'),
			owner: mongoose.mongo.ObjectId('5cf9303bec9d6ac639fefd42'),
			parent: '5ca613c4c7f5120b8c5bef33',
			refOwnerModel: 'teams',
			permissions: teamRoles.map(({ refId }) => ({
				refId,
				refPermModel: 'role',
				read: refId !== '6bb5c190fb457b1c3c0c7e0f',
				delete: true,
				write: true,
				create: true,
			})),
			isDirectory: false,
		},
		{
			_id: mongoose.mongo.ObjectId('5ca613c4c7f5120b8c5bef33'),
			owner: mongoose.mongo.ObjectId('5cf9303bec9d6ac639fefd42'),
			refOwnerModel: 'teams',
			permissions: [
				{
					refId: '0000d224816abba584714c8e',
					refPermModel: 'user',
					read: true,
				},
				...teamRoles.map(({ refId }) => ({
					refId,
					refPermModel: 'role',
					read: true,
					delete: true,
					write: true,
					create: true,
				})),
			],
			isDirectory: true,
		},
		{
			_id: mongoose.mongo.ObjectId('5ca613c4c7f5120b8c5bef34'),
			owner: mongoose.mongo.ObjectId('0000dcfbfb5c7a3f00bf21ac'),
			refOwnerModel: 'course',
			storageFileName: 'test',
			permissions: [
				{
					refId: '0000d186816aaaa584714c98',
					refPermModel: 'role',
					read: true,
					delete: true,
				},
			],
			isDirectory: false,
		},
		{
			_id: mongoose.mongo.ObjectId('5ca613c4c7f5120b8c5bef35'),
			owner: mongoose.mongo.ObjectId('0000dcfbfb5c7a3f00bf21ac'),
			refOwnerModel: 'course',
			permissions: [
				{
					refId: '0000d186816aaaa584714c98',
					refPermModel: 'role',
					read: true,
					delete: false,
				},
			],
			isDirectory: false,
		},
		{
			_id: mongoose.mongo.ObjectId('5ca613c4c7f5120b8c5bef36'),
			owner: mongoose.mongo.ObjectId('0000dcfbfb5c7a3f00bf21ac'),
			refOwnerModel: 'course',
			permissions: [
				{
					refId: '0000d186816aaaa584714c98',
					refPermModel: 'role',
					read: true,
					write: true,
				},
			],
			isDirectory: true,
		},
		{
			_id: mongoose.mongo.ObjectId('5ca613c4c7f5120b8c5bef37'),
			owner: mongoose.mongo.ObjectId('0000dcfbfb5c7a3f00bf21ac'),
			refOwnerModel: 'course',
			permissions: [
				{
					refId: '0000d186816aaaa584714c98',
					refPermModel: 'role',
					read: true,
					write: true,
				},
			],
			isDirectory: false,
		},
	],
};
