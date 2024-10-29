// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('schulcloud');

// db.getCollection('courses').find({
// 	_id: ObjectId('0000dcfbfb5c7a3f00bf21ab'),
// });

// db.getCollection('users').find({
// 	email: { $regex: /tsc.lehrer@tsp.de/, $options: 'i' },
// });

// Create a new document in the collection.
// db.getCollection('schools').find({
//     ldapSchoolIdentifier: '18606',
// })

// db.getCollection('systems').remove({
// 	alias: { $regex: 'tsp', $options: 'i' },
// });

db.getCollection('users').find({
	ldapId: { $exists: true },
	// ldapId: { $regex: '66d707f5c5202ba10c5e6256', $options: 'i' },
});

// db.getCollection('systems').insertOne({
// 	_id: ObjectId('66d707f5c5202ba10c5e6256'),
// 	alias: 'TSP',
// 	displayName: 'Thüringer Schulportal',
// 	type: 'oauth',
// 	provisioningStrategy: 'tsp',
// 	oauthConfig: {
// 		clientId: 'tis-ci-schulcloud-ad52150a5e48',
// 		clientSecret: 'ceSQAWwZYEbpgkmTJdQXvpceDT7uEYkx',
// 		tokenEndpoint: 'https://test2.schulportal-thueringen.de/auth/realms/TIS/protocol/openid-connect/token',
// 		grantType: 'authorization_code',
// 		scope: 'openid',
// 		responseType: 'code',
// 		redirectUri: 'http://localhost:3030/api/v3/sso/oauth',
// 		authEndpoint: 'https://test2.schulportal-thueringen.de/auth/realms/TIS/protocol/openid-connect/auth',
// 		provider: 'tsp',
// 		jwksEndpoint: 'https://test2.schulportal-thueringen.de/auth/realms/TIS/protocol/openid-connect/certs',
// 		issuer: 'https://test2.schulportal-thueringen.de/auth/realms/TIS',
// 	},
// });

// db.getCollection('schools').insertOne({
// 	name: 'TSP Schüler Test Schule',
// 	ldapSchoolIdentifier: '11111',
// 	fileStorageType: 'awsS3',
// 	federalState: ObjectId('0000b186816abba584714c65'),
// 	systems: [ObjectId('66d707f5c5202ba10c5e6256')],
// 	purpose: 'demo',
// 	features: ['rocketChat', 'ldapUniventionMigrationSchool', 'videoconference', 'oauthProvisioningEnabled'],
// 	enableStudentTeamCreation: false,
// 	permissions: {
// 		teacher: {
// 			STUDENT_LIST: true,
// 		},
// 	},
// })
