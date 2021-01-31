const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { schoolModel: School, yearModel: YearModel } = require('../../../src/services/school/model');
const { equal: equalIds } = require('../../../src/helper/compare').ObjectId;

const app = require('../../../src/app');
const TestObjectsGenerator = require('../helpers/TestObjectsGenerator');

describe.only('school service', () => {
    let server;
    let tog;
    let schoolService;

    before(async () => {
        server = await app.listen();
        schoolService = app.service('/schools');
        tog = new TestObjectsGenerator(app);
    });

    after(async () => {
        await tog.cleanup();
        await server.close();
    });

    it('registered services', () => {
        expect(schoolService).to.not.be.null;
        expect(app.service('years')).to.not.be.null;
        expect(app.service('gradeLevels')).to.not.be.null;
    });

    const compareSchoolYears = (schoolYears, defaultYears) => {
        schoolYears.forEach((resultYear, idx) => {
            const defaultYear = defaultYears[idx];
            expect(resultYear.name).to.be.equal(defaultYear.name);
        });
    };

    describe('create school with or without year', () => {
        let defaultYears = null;
        let sampleYear;
        let sampleSchoolData;

        before('load data and set samples', async () => {
            defaultYears = await YearModel.find().sort('name').lean().exec();
            sampleYear = defaultYears[0];
            const school = await tog.createTestSchool();
            sampleSchoolData = await School.findById(school._id).lean().exec();
            delete sampleSchoolData._id;
        });

        it('should be possible to see only limited amount of fields if the user is not logged in', async () => {
            const params = {
                provider: 'rest',
                headers: {
                    authorization: undefined,
                },
                account: undefined,
                query: { $sort: { _id: 1 } },
            };
            const result = await schoolService.find(params);
            const expectedFields = ['purpose', 'name', '_id', 'id', 'systems', 'years', 'isTeamCreationByStudentsEnabled'];
            const notExpectedFields = ['fileStorageType', 'documentBaseDir', 'inMaintenance', 'currentYear', 'federalState'];
            result.data.forEach((school) => {
                expectedFields.forEach((field) => {
                    expect(school).to.haveOwnProperty(field);
                });
                notExpectedFields.forEach((field) => {
                    expect(school).to.not.haveOwnProperty(field);
                });
            });
        });

        it('should be possible to see all fields if the call is done from the server', async () => {
            const params = { provider: undefined, query: { $sort: { _id: 1 } } };

            const result = await schoolService.find(params);
            const expectedFields = [
                'purpose',
                'name',
                'id',
                'years',
                'isTeamCreationByStudentsEnabled',
                'fileStorageType',
                'documentBaseDir',
                'inMaintenance',
                'currentYear',
                'systems',
                // 'federalState', // there is a school in the test database that doesn't have this field
            ];

            result.data.forEach((school) => {
                expectedFields.forEach((field) => {
                    expect(school).to.haveOwnProperty(field);
                });
            });
        });

        it('load the school results with pagination', async () => {
            const result = await schoolService.find({ query: { $sort: { _id: 1 } } });
            result.data.forEach((school) => {
                compareSchoolYears(school.years.schoolYears, defaultYears);
                expect(school.isTeamCreationByStudentsEnabled).to.be.not.undefined;
            });
        });

        it('load the school results without pagination', async () => {
            const result = await schoolService.find({
                paginate: false,
                query: { $sort: { _id: 1 } },
            });
            result.forEach((school) => {
                compareSchoolYears(school.years.schoolYears, defaultYears);
                expect(school.isTeamCreationByStudentsEnabled).to.be.not.undefined;
            });
        });

        it('create school with timezone', async () => {
            const defaultTz = 'Europe/Berlin';
            const serviceCreatedSchool = await schoolService.create({ ...sampleSchoolData, timezone: defaultTz });
            const { _id: schoolId } = serviceCreatedSchool;
            tog.createdEntityIds.schools.push(schoolId);
            const out = await schoolService.get(schoolId);
            expect(out, 'school has been saved').to.be.not.null;
            expect(out.timezone, 'the defined timezone has been added to the school').to.be.equal(defaultTz);
        });

        it('create school with currentYear defined explictly', async () => {
            const serviceCreatedSchool = await schoolService.create({ ...sampleSchoolData, currentYear: sampleYear });
            const { _id: schoolId } = serviceCreatedSchool;
            tog.createdEntityIds.schools.push(schoolId);
            const out = await schoolService.get(schoolId);
            expect(out, 'school has been saved').to.be.not.null;
            expect(out.currentYear, 'the defined year has been added to the school').to.be.ok;
            expect(equalIds(sampleYear._id, out.currentYear), 'the defined year has been added to the school').to.be.true;
        });

        it('create school with no currentYear defined that will be added', async () => {
            const serviceCreatedSchool = await schoolService.create(sampleSchoolData);
            const { _id: schoolId } = serviceCreatedSchool;
            tog.createdEntityIds.schools.push(schoolId);
            const out = await schoolService.get(schoolId);
            expect(out, 'school has been saved').to.be.not.null;
            const { currentYear } = out;
            expect(currentYear, 'the defined year has been added to the school').to.be.ok;
            const foundYear = defaultYears.filter((year) => equalIds(year._id, currentYear));
            expect(foundYear.length, 'the auto added year exists in years').to.be.equal(1);
            // here we could test, we have defaultYear added but however we just need any year
            // to be set and this should not test year logic
        });

        it('isExternal attribute is true when ldapSchoolIdentifier is not undefined', async () => {
            const serviceCreatedSchool = await schoolService.create({
                ...sampleSchoolData,
                ldapSchoolIdentifier: 'testId'
            });
            const { _id: schoolId } = serviceCreatedSchool;
            tog.createdEntityIds.schools.push(schoolId);
            const school = await schoolService.get(schoolId);
            expect(school.isExternal).to.be.true;
        });

        it('isExternal attribute is true when source is not undefined', async () => {
            const serviceCreatedSchool = await schoolService.create({ ...sampleSchoolData, source: 'testSource' });
            const { _id: schoolId } = serviceCreatedSchool;
            tog.createdEntityIds.schools.push(schoolId);
            const school = await schoolService.get(schoolId);
            expect(school.isExternal).to.be.true;
        });

        it('isExternal attribute is true when ldapSchoolIdentifier and source are defined', async () => {
            const serviceCreatedSchool = await schoolService.create({
                ...sampleSchoolData,
                ldapSchoolIdentifier: 'testId',
                source: 'testSource',
            });
            const { _id: schoolId } = serviceCreatedSchool;
            tog.createdEntityIds.schools.push(schoolId);
            const school = await schoolService.get(schoolId);
            expect(school.isExternal).to.be.true;
        });

        it('isExternal attribute is false when source is undefined', async () => {
            const serviceCreatedSchool = await schoolService.create({ ...sampleSchoolData });
            const { _id: schoolId } = serviceCreatedSchool;
            tog.createdEntityIds.schools.push(schoolId);
            const school = await schoolService.get(schoolId);
            expect(school.isExternal).to.be.false;
        });
    });

    describe('patch schools', () => {
        it('administrator can patch his own school', async () => {
            const school = await tog.createTestSchool({});
            const { user: admin } = await tog.createTestUserAndAccount({
                schoolId: school._id,
                roles: ['administrator'],
            });
            const params = await tog.generateRequestParamsFromUser(admin);

            const result = await schoolService.patch(school._id, { features: ['rocketChat'] }, params);
            expect(result).to.not.be.undefined;
            expect(result.features).to.include('rocketChat');
        });

        it('administrator can not patch a different school', async () => {
            const usersSchool = await tog.createTestSchool({});
            const otherSchool = await tog.createTestSchool({});
            const { user: admin } = await tog.createTestUserAndAccount({
                schoolId: usersSchool._id,
                roles: ['administrator'],
            });
            const params = await tog.generateRequestParamsFromUser(admin);

            try {
                await schoolService.patch(otherSchool._id, { features: ['rocketChat'] }, params);
                throw new Error('should have failed');
            } catch (err) {
                expect(err.message).to.not.equal('should have failed');
                expect(err.code).to.equal(403);
            }
        });

        it('superhero can patch any school', async () => {
            const usersSchool = await tog.createTestSchool({});
            const otherSchool = await tog.createTestSchool({});
            const { user: batman } = await tog.createTestUserAndAccount({
                schoolId: usersSchool._id,
                roles: ['superhero'],
            });
            const params = await tog.generateRequestParamsFromUser(batman);

            const result = await app
                    .service('/schools')
                    .patch(otherSchool._id, { name: 'all strings are better with "BATMAN!" in it!' }, params);
            expect(result).to.not.be.undefined;
            expect(result.name).to.equal('all strings are better with "BATMAN!" in it!');
        });

        it('push as admin', async () => {
            const school = await tog.createTestSchool({});
            const { user: admin } = await tog.createTestUserAndAccount({
                schoolId: school._id,
                roles: ['administrator'],
            });
            const params = await tog.generateRequestParamsFromUser(admin);

            const body = { $push: { features: 'rocketChat' } };
            const result = await schoolService.patch(school._id, body, params);
            expect(result).to.not.be.undefined;
            expect(result.features).to.include('rocketChat');
        });

        it('unable without permissions', async () => {
            const school = await tog.createTestSchool({});
            const role = await tog.createTestRole({ name: 'noPermissions', permissions: [] });
            const { user: admin } = await tog.createTestUserAndAccount({
                schoolId: school._id,
                roles: [role.name],
            });
            const params = await tog.generateRequestParamsFromUser(admin);

            const body = { $push: { features: 'rocketChat' } };
            const result = await schoolService.patch(school._id, body, params);
            expect(result).to.not.be.undefined;
            expect(result.features).to.not.include('rocketChat');
        });

        it('possible with SCHOOL_CHAT_MANAGE permissions', async () => {
            const school = await tog.createTestSchool({});
            const role = await tog.createTestRole({
                name: 'chatPermissions',
                permissions: ['SCHOOL_CHAT_MANAGE'],
            });
            const { user: admin } = await tog.createTestUserAndAccount({
                schoolId: school._id,
                roles: [role.name],
            });
            const params = await tog.generateRequestParamsFromUser(admin);

            const body = { $push: { features: 'rocketChat' } };
            const result = await schoolService.patch(school._id, body, params);
            expect(result).to.not.be.undefined;
            expect(result.features).to.include('rocketChat');
        });

        it('team creation by students should be updated according to environment setting without admin setting', async () => {
            const school = await tog.createTestSchool({});

            Configuration.set('STUDENT_TEAM_CREATION', 'enabled');
            let result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.true;

            Configuration.set('STUDENT_TEAM_CREATION', 'disabled');
            result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.false;

            Configuration.set('STUDENT_TEAM_CREATION', 'opt-in');
            result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.false;

            Configuration.set('STUDENT_TEAM_CREATION', 'opt-out');
            result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.true;
        });

        it('team creation by students should be updated according to environment setting and enabled by admin', async () => {
            // school with enabled student team creation by admin
            const school = await tog.createTestSchool({ enableStudentTeamCreation: true });
            expect(school.enableStudentTeamCreation).to.be.true;

            Configuration.set('STUDENT_TEAM_CREATION', 'enabled');
            let result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.true;

            Configuration.set('STUDENT_TEAM_CREATION', 'disabled');
            result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.false;

            Configuration.set('STUDENT_TEAM_CREATION', 'opt-in');
            result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.true;

            Configuration.set('STUDENT_TEAM_CREATION', 'opt-out');
            result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.true;
        });

        it('team creation by students should be updated according to environment setting and disabled by admin', async () => {
            // school with enabled student team creation by admin
            const school = await tog.createTestSchool({ enableStudentTeamCreation: false });
            expect(school.enableStudentTeamCreation).to.be.false;

            Configuration.set('STUDENT_TEAM_CREATION', 'enabled');
            let result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.true;

            Configuration.set('STUDENT_TEAM_CREATION', 'disabled');
            result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.false;

            Configuration.set('STUDENT_TEAM_CREATION', 'opt-in');
            result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.false;

            Configuration.set('STUDENT_TEAM_CREATION', 'opt-out');
            result = await schoolService.get(school._id);
            expect(result.isTeamCreationByStudentsEnabled).to.be.false;
        });

        it('should fail to update officialSchoolNumber with wrong format', async () => {
            const school = await tog.createTestSchool({});
            const { user: admin } = await tog.createTestUserAndAccount({
                schoolId: school._id,
                roles: ['administrator'],
            });
            const params = await tog.generateRequestParamsFromUser(admin);

            try {
                await schoolService.patch(school._id, { officialSchoolNumber: 'foo' }, params);
            } catch (err) {
                expect(err).to.not.equal(undefined);
                expect(err.message).to.include('School number is incorrect');
                expect(err.name).to.be.equal('Error');
            }
        });

        it('should fail to update officialSchoolNumber if school already have one', async () => {
            const school = await tog.createTestSchool({ officialSchoolNumber: 'bv-12345' });
            const { user: admin } = await tog.createTestUserAndAccount({
                schoolId: school._id,
                roles: ['administrator'],
            });
            const params = await tog.generateRequestParamsFromUser(admin);

            try {
                await schoolService.patch(school._id, { officialSchoolNumber: 'vb-54321' }, params);
            } catch (err) {
                expect(err).to.not.equal(undefined);
                expect(err.message).to.include('School number is incorrect');
                expect(err.name).to.be.equal('Error');
            }
        });

        it('should succeed to update officialSchoolNumber with correct format', async () => {
            const school = await tog.createTestSchool({});
            const { user: admin } = await tog.createTestUserAndAccount({
                schoolId: school._id,
                roles: ['administrator'],
            });
            const params = await tog.generateRequestParamsFromUser(admin);

            const schoolNumber = 'BA-13371';
            let result;

            try {
                result = await schoolService.patch(school._id, { officialSchoolNumber: schoolNumber }, params);
            } catch (err) {
                throw new Error('should not have failed', err);
            }
            expect(result.officialSchoolNumber).to.be.equal(schoolNumber);
        });

        it('should succeed to update officialSchoolNumber if school already have one and user is a superhero', async () => {
            const school = await tog.createTestSchool({ officialSchoolNumber: 'uw-42069' });
            const { user: admin } = await tog.createTestUserAndAccount({
                schoolId: school._id,
                roles: ['superhero'],
            });
            const params = await tog.generateRequestParamsFromUser(admin);

            const schoolNumber = 'BA-13371';
            let result;

            try {
                result = await schoolService.patch(school._id, { officialSchoolNumber: schoolNumber }, params);
            } catch (err) {
                throw new Error('should not have failed', err);
            }
            expect(result.officialSchoolNumber).to.be.equal(schoolNumber);
        });

        it('should fail to update county if state does not have the provided county ', async () => {
            const school = await tog.createTestSchool({ federalState: '0000b186816abba584714c53' });
            const { user: admin } = await tog.createTestUserAndAccount({
                schoolId: school._id,
                roles: ['administrator'],
            });
            const params = await tog.generateRequestParamsFromUser(admin);

            try {
                await schoolService.patch(school._id, { county: '123' }, params);
            } catch (err) {
                expect(err).to.not.equal(undefined);
                expect(err.message).to.include(`The state doesn't not have a matching county`);
                expect(err.name).to.be.equal('Error');
            }
        });

        it('should succeed to update county if state have the provided county ', async () => {
            const school = await tog.createTestSchool({ federalState: '0000b186816abba584714c53' });
            const { user: admin } = await tog.createTestUserAndAccount({
                schoolId: school._id,
                roles: ['administrator'],
            });
            const params = await tog.generateRequestParamsFromUser(admin);
            const countyId = '5fa55eb53f472a2d986c8812';
            const result = await schoolService.patch(school._id, { county: countyId }, params);
            expect(result.county._id.toString()).to.be.eq(countyId);
        });
    });
});