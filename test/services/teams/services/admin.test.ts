import mongoose from 'mongoose';
import assertImport from 'assert'; 
const assert = assertImport.strict;

import appPromise from '../../../../src/app';

import AdminOverview from '../../../../src/services/teams/services/admin';

describe("'/teams/manage/admin' service", () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	it('registered the service', () => {
		const service = app.service('/teams/manage/admin');

		assert.ok(service, 'Registered the service');
	});

	describe('mapped function', () => {
		let teams;
		let expectedResult;
		const sessionSchoolId = mongoose.Types.ObjectId('4edd40c86762e0fb12000003');

		beforeEach(() => {
			const createdAt = Date.now();
			const teamId = mongoose.Types.ObjectId('5f2987e020834114b8efd6f7');
			const userId = mongoose.Types.ObjectId('0000d733686abba584714c55');

			teams = {
				data: [
					{
						_id: teamId,
						color: '#d32f2f',
						name: 'spinatenpower',
						createdAt,
						features: ['isTeam'],
						desciption: 'Spintatenpower makes teams greate again',
						schoolId: sessionSchoolId,
						schoolIds: [
							{
								_id: sessionSchoolId,
								name: 'Schiller-Oberschule',
								fileStorageType: 'awsS3',
								systems: ['0000d186816abba584714c90'],
								updatedAt: '2017-01-01T00:06:37.148Z',
								createdAt: '2017-01-01T00:06:37.148Z',
								__v: 0,
								currentYear: '5b7de0021a3a07c20a1c165e',
								purpose: 'demo',
							},
						],
						userIds: [
							{
								schoolId: sessionSchoolId,
								role: {
									name: 'teamowner',
								},
								userId: {
									_id: userId,
									roles: [
										{
											name: 'lehrer',
											createdAt,
										},
									],
									firstName: 'Hans',
									lastName: 'Peter',
									should: 'removed',
								},
							},
						],
					},
				],
				limit: 50,
				skip: 0,
				total: 1,
			};

			expectedResult = {
				limit: 50,
				skip: 0,
				total: 1,
				data: [
					{
						membersTotal: 1,
						name: 'spinatenpower',
						_id: teamId,
						color: '#d32f2f',
						desciption: 'Spintatenpower makes teams greate again',
						createdAtMySchool: true,
						hasMembersOfOtherSchools: false,
						hasRocketChat: false,
						createdAt,
						ownerExist: true,
						schools: [
							{
								_id: sessionSchoolId,
								name: 'Schiller-Oberschule',
							},
						],
						schoolMembers: [
							{
								role: 'teamowner',
								user: {
									_id: userId,
									firstName: 'Hans',
									lastName: 'Peter',
									roles: ['lehrer'],
								},
							},
						],
					},
				],
			};
		});

		it('test basic functionality', async () => {
			const result = AdminOverview.mapped(teams, sessionSchoolId);
			assert.deepStrictEqual(result, expectedResult);
		});

		it('team without owner', async () => {
			teams.data[0].userIds[0].role.name = 'teammember';
			expectedResult.data[0].schoolMembers[0].role = 'teammember';
			expectedResult.data[0].ownerExist = false;

			const result = AdminOverview.mapped(teams, sessionSchoolId);

			assert.deepStrictEqual(result, expectedResult);
		});

		it('created at other school', async () => {
			const schoolId = mongoose.Types.ObjectId('4edd40c86372e0fb12000007');

			teams.data[0].schoolId = schoolId;
			teams.data[0].userIds[0].schoolId = schoolId;
			teams.data[0].schoolIds.push({ ...teams.data[0].schoolIds[0] });
			teams.data[0].schoolIds[1]._id = schoolId;

			expectedResult.data[0].createdAtMySchool = false;
			expectedResult.data[0].hasMembersOfOtherSchools = true;
			expectedResult.data[0].schoolMembers = [];
			expectedResult.data[0].schools.push({
				_id: schoolId,
				name: teams.data[0].schoolIds[1].name,
			});

			const result = AdminOverview.mapped(teams, sessionSchoolId);

			assert.deepStrictEqual(result, expectedResult);
		});

		it('rocket chat is activeted', async () => {
			teams.data[0].features.push('rocketChat');
			expectedResult.data[0].hasRocketChat = true;
			const result = AdminOverview.mapped(teams, sessionSchoolId);
			assert.deepStrictEqual(result, expectedResult);
		});
	});
});
