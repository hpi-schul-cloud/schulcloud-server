const { expect } = require('chai');
const mongoose = require('mongoose');
const assert = require('assert').strict;

const app = require('../../../../src/app');

const AdminOverview = require('../../../../src/services/teams/services/admin');

describe('\'/teams/manage/admin\' service', () => {
    it('registered the service', () => {
        const service = app.service('/teams/manage/admin');
    
        assert.ok(service, 'Registered the service');
    });


    it('mapped function', async () => {

        
        const sessionSchoolId = mongoose.Types.ObjectId('4edd40c86762e0fb12000003');

        const createdAt = Date.now();
        const teamId = mongoose.Types.ObjectId('0000d186816abba584714c55');
        const userId = mongoose.Types.ObjectId('0000d733686abba584714c55');

        const teams = {
            data: [{
                _id: teamId,
                color: '#d32f2f',
                name: 'spintenpower',
                createdAt,
                description: 'Spintatenpower makes teams greate again',
                schoolId: sessionSchoolId,
                schoolIds: [
                    {
                        "_id": sessionSchoolId,
                        "name":"Schiller-Oberschule",
                        "fileStorageType":"awsS3",
                        "systems":["0000d186816abba584714c90"],
                        "updatedAt":"2017-01-01T00:06:37.148Z",
                        "createdAt":"2017-01-01T00:06:37.148Z",
                        "__v":0,
                        "currentYear":"5b7de0021a3a07c20a1c165e",
                        "purpose":"demo"
                    }
                ],
                userIds: [
                    {
                        schoolId: sessionSchoolId,
                        role: {
                            name: 'teamowner'
                        },
                        userId: {
                            _id: userId,
                            roles: [
                                {
                                    name: 'teacher',
                                    createdAt: createdAt
                                }
                            ],
                            firstName: 'Hans',
                            lastName: 'Peter',
                            should: 'removed'
                        }
                    }
                ]


            }],
            limit: 50,
            skip: 0,
            total: 1
        };

        const result = AdminOverview.mapped(teams, sessionSchoolId);

        const expectedResult = {
            membersTotal: 1,
            name: 'spinatenpower',
            _id: teamId,
            color: '#d32f2f',
            description: 'Spintatenpower makes teams greate again',
            createdAtMySchool: true,
            hasMembersOfOtherSchools: false,
            createdAt: createdAt,
            ownerExist: true,
            schools: [{
                _id: sessionSchoolId,
                name: "Schiller-Oberschule",
            }],
            schoolMembers: [
                {
                    schoolId: sessionSchoolId,
                    role: 'teamowner',
                    user: {
                        _id: userId,
                        firstName: 'Hans',
                        lastName: 'Peter',
                        roles: ['lehrer']
                    }
                }
            ]
        }

        assert.deepStrictEqual(result.toString(), expectedResult.toString());
    });
});
