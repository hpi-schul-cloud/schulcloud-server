const { expect } = require('chai');
const sinon = require('sinon');
const assert = require('assert');

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const { enforceRoleHierarchyOnCreate, checkUniqueEmail } = require('../../../../src/services/user/hooks/userService');
const { generateRequestParams } = require('../../helpers/services/login')(appPromise);

const {
    removeStudentFromCourses,
    removeStudentFromClasses,
    generateRegistrationLink,
    decorateUsers,
} = require('../../../../src/services/user/hooks/userService');

describe('removeStudentFromCourses', () => {
    let app;
    let server;

    before(async () => {
        app = await appPromise;
        server = await app.listen(0);
    });

    after((done) => {
        server.close(done);
    });

    afterEach(async () => {
        await testObjects.cleanup();
    });

    it('removes single student from all his courses', async () => {
        const user = await testObjects.createTestUser({ roles: ['student'] });
        const courses = await Promise.all([
            testObjects.createTestCourse({ userIds: [user._id] }),
            testObjects.createTestCourse({ userIds: [user._id] }),
        ]);
        await removeStudentFromCourses({ id: user._id, app });
        const { data: updatedCourses } = await app.service('courses').find({
            query: { _id: { $in: courses.map((c) => c._id) } },
        });

        expect(updatedCourses.length).to.equal(2);
        const userInAnyCourse = updatedCourses.some((course) =>
                course.userIds.some((id) => id.toString()===user._id.toString())
        );
        expect(userInAnyCourse).to.equal(false);
    });

    it('removes multiple students from all their courses', async () => {
        const { _id: firstId } = await testObjects.createTestUser({ roles: ['student'] });
        const { _id: secondId } = await testObjects.createTestUser({ roles: ['student'] });
        const courses = await Promise.all([
            testObjects.createTestCourse({ userIds: [firstId._id] }),
            testObjects.createTestCourse({ userIds: [firstId._id, secondId._id] }),
            testObjects.createTestCourse({ userIds: [secondId._id] }),
        ]);
        await removeStudentFromCourses({ id: null, result: [{ _id: firstId }, { _id: secondId }], app });
        const { data: updatedCourses } = await app.service('courses').find({
            query: { _id: { $in: courses.map((c) => c._id) } },
        });
        expect(updatedCourses.length).to.equal(3);
        const userInAnyCourse = updatedCourses.some((course) =>
                course.userIds.some((id) => id.toString()===firstId._id.toString() || id.toString()===secondId._id.toString())
        );
        expect(userInAnyCourse).to.equal(false);
    });
});

describe('removeStudentFromClasses', () => {
    let app;
    let server;

    before(async () => {
        app = await appPromise;
        server = await app.listen(0);
    });

    after((done) => {
        server.close(done);
    });

    afterEach(async () => {
        await testObjects.cleanup();
    });

    it('removes single student from all his classes', async () => {
        const user = await testObjects.createTestUser({ roles: ['student'] });
        const classes = await Promise.all([
            testObjects.createTestClass({ userIds: [user._id] }),
            testObjects.createTestClass({ userIds: [user._id] }),
        ]);
        await removeStudentFromClasses({ id: user._id, app });
        const { data: updatedClasses } = await app.service('classes').find({
            query: { _id: { $in: classes.map((c) => c._id) } },
        });

        expect(updatedClasses.length).to.equal(2);
        const userInAnyClass = updatedClasses.some((klass) =>
                klass.userIds.some((id) => id.toString()===user._id.toString())
        );
        expect(userInAnyClass).to.equal(false);
    });

    it('removes multiple students from all their classes', async () => {
        const { _id: firstId } = await testObjects.createTestUser({ roles: ['student'] });
        const { _id: secondId } = await testObjects.createTestUser({ roles: ['student'] });
        const classes = await Promise.all([
            testObjects.createTestClass({ userIds: [firstId._id] }),
            testObjects.createTestClass({ userIds: [firstId._id, secondId._id] }),
            testObjects.createTestClass({ userIds: [secondId._id] }),
        ]);
        await removeStudentFromClasses({ id: null, result: [{ _id: firstId }, { _id: secondId }], app });
        const { data: updatedClasses } = await app.service('classes').find({
            query: { _id: { $in: classes.map((c) => c._id) } },
        });
        expect(updatedClasses.length).to.equal(3);
        const userInAnyClass = updatedClasses.some((klass) =>
                klass.userIds.some((id) => id.toString()===firstId._id.toString() || id.toString()===secondId._id.toString())
        );
        expect(userInAnyClass).to.equal(false);
    });
});

describe('generateRegistrationLink', () => {
    let app;
    let server;

    before(async () => {
        app = await appPromise;
        server = await app.listen(0);
    });

    after(async () => {
        await server.close();
    });

    afterEach(async () => {
        await testObjects.cleanup();
    });

    const expectedErrorMessage = 'Roles must be exactly of length one if generateRegistrationLink=true is set.';

    const getAppMock = (registrationlinkMock) => ({
        service: (service) => {
            if (service==='/registrationlink') {
                return {
                    create: async (data) => registrationlinkMock(data),
                };
            }
            throw new Error('unknown service');
        },
    });

    it('throws an error if roles is not defined', async () => {
        const context = {
            data: {
                generateRegistrationLink: true,
            },
        };
        try {
            await generateRegistrationLink(context);
            throw new Error('should have failed');
        } catch (err) {
            expect(err.message).to.not.equal('should have failed');
            expect(err.code).to.equal(400);
            expect(err.message).to.equal(expectedErrorMessage);
        }
    });

    it('throws an error if user has more than one role', async () => {
        const context = {
            data: {
                generateRegistrationLink: true,
                roles: ['student', 'teacher'],
            },
        };
        try {
            await generateRegistrationLink(context);
            throw new Error('should have failed');
        } catch (err) {
            expect(err.message).to.not.equal('should have failed');
            expect(err.code).to.equal(400);
            expect(err.message).to.equal(expectedErrorMessage);
        }
    });

    it('verify if hash is not generated when user already has an account', async () => {
        const registrationLinkService = app.service('registrationlink');
        const email = `max${Date.now()}@mustermann.de`;
        const user = await testObjects.createTestUser({
            email,
            firstName: 'Max',
            lastName: 'Mustermann',
            roles: 'student',
        });
        const username = user.email;
        const password = 'Schulcloud1!';
        await testObjects.createTestAccount({ username, password }, 'local', user);
        await generateRequestParams({ username, password });
        try {
            await registrationLinkService.create({ toHash: user.email });
            expect.fail('Should have failed with BadRequest');
        } catch (error) {
            expect(error.message).to.equal('Fehler beim Generieren des Hashes. BadRequest: User already has an account.');
        }
    });

    it('catches errors from /registrationlink', async () => {
        const context = {
            app: getAppMock(() => {
                throw new Error('test error');
            }),
            data: {
                generateRegistrationLink: true,
                roles: ['student'],
            },
        };
        try {
            await generateRegistrationLink(context);
            throw new Error('should have failed');
        } catch (err) {
            expect(err.message).to.not.equal('should have failed');
            expect(err.code).to.equal(500);
            expect(err.message).to.equal('Can not create registrationlink. Error: test error');
        }
    });

    it('appends generated hash as importHash to context.data', async () => {
        const expectedHash = 'testhash';
        const userData = {
            roles: ['student'],
            schoolId: 'schoolId',
            email: 'user@email.de',
        };
        const context = {
            app: getAppMock((data) => {
                if (
                        data.role===userData.roles[0] &&
                        data.save===true &&
                        data.patchUser===true &&
                        data.host &&
                        data.schoolId===userData.schoolId &&
                        data.toHash===userData.email
                ) {
                    return { hash: expectedHash };
                }
                throw new Error('wrong arguments passed to CREATE /registrationlink');
            }),
            data: {
                ...userData,
                generateRegistrationLink: true,
            },
        };
        await generateRegistrationLink(context);
        expect(context.data.importHash).to.equal(expectedHash);
    });
});

describe('enforceRoleHierarchyOnCreate', () => {
    let app;
    let server;

    before(async () => {
        app = await appPromise;
        server = await app.listen(0);
    });

    after(async () => {
        await server.close();
    });

    afterEach(async () => {
        await testObjects.cleanup();
    });

    const expectedErrorMessageForbidden = 'Your are not allowed to create a user with the given role';

    function createContext(createrRoles, createrPermissions, createdRoleIDs, createdRole) {
        const context = {
            app: {
                service: (serviceName) => {
                    if (serviceName==='users') {
                        return {
                            get: () => Promise.resolve({ permissions: createrPermissions, roles: createrRoles }),
                        };
                    }
                    if (serviceName==='roles') {
                        return {
                            get: () => {
                                if (createdRole) {
                                    return Promise.resolve(createdRole);
                                }
                                // eslint-disable-next-line prefer-promise-reject-errors
                                return Promise.reject(new Error('not found'));
                            },
                        };
                    }
                    return null;
                },
            },
            data: {
                roles: createdRoleIDs,
            },
            params: {
                account: { userId: '1234' },
            },
        };
        return context;
    }

    it('fails to create a user with role "student"', async () => {
        const context = createContext([], [], ['student']);
        try {
            await enforceRoleHierarchyOnCreate(context);
            assert.fail('role check resolved, but role is forbidden');
        } catch (error) {
            expect(error.message).to.equal(expectedErrorMessageForbidden);
        }
    });

    it('fails to create a user with role "student" by role ID', async () => {
        const context = createContext([], [], ['1234d186816abba584714c00'], ['student']);
        try {
            await enforceRoleHierarchyOnCreate(context);
            assert.fail('role check resolved, but role is forbidden');
        } catch (error) {
            expect(error.message).to.equal(expectedErrorMessageForbidden);
        }
    });

    it('fails to create a user with unknown role ID', async () => {
        const context = createContext([], [], ['1234d186816abba584714c00']);
        try {
            await enforceRoleHierarchyOnCreate(context);
            assert.fail('role check resolved, but role is unknown');
        } catch (error) {
            expect(error.message).to.equal('No such role exists');
        }
    });

    it('fails to create a user with unknown role name', async () => {
        const context = createContext([], [], ['asdfasdf']);
        try {
            await enforceRoleHierarchyOnCreate(context);
            assert.fail('role check resolved, but role is unknown');
        } catch (error) {
            expect(error.message).to.equal(expectedErrorMessageForbidden);
        }
    });

    it('succeeds to create auser with role "parent" and "teacher', async () => {
        const context = createContext([], [], ['parent', 'teacher']);
        try {
            await enforceRoleHierarchyOnCreate(context);
            assert.fail('role check resolved, but role is forbidden');
        } catch (error) {
            expect(error.message).to.equal(expectedErrorMessageForbidden);
        }
    });

    it('succeeds to create auser with role "student"', async () => {
        const context = createContext([], ['STUDENT_CREATE'], ['student']);
        try {
            await enforceRoleHierarchyOnCreate(context);
        } catch (error) {
            assert.fail(`expected promise resolved, but error was '${error.message}'`);
        }
    });

    it('succeeds to create user with role "student" by role ID', async () => {
        const context = createContext([], ['STUDENT_CREATE'], ['1234d186816abba584714c00'], { name: 'student' });
        try {
            await enforceRoleHierarchyOnCreate(context);
        } catch (error) {
            assert.fail(`expected promise resolved, but error was '${error.message}'`);
        }
    });

    it('succeeds to create user with role "parent"', async () => {
        const context = createContext([], [], ['parent']);
        try {
            await enforceRoleHierarchyOnCreate(context);
        } catch (error) {
            assert.fail(`expected promise resolved, but error was '${error.message}'`);
        }
    });

    it('succeeds to create a user with an unknown role by a superhero user', async () => {
        const context = createContext([{ name: 'superhero' }], [], ['asdfasdf']);
        try {
            await enforceRoleHierarchyOnCreate(context);
        } catch (error) {
            assert.fail(`expected promise resolved, but error was '${error.message}'`);
        }
    });

    it('succeeds to create auser with role "student" and "parent', async () => {
        const context = createContext([], ['STUDENT_CREATE'], ['student', 'parent']);
        try {
            await enforceRoleHierarchyOnCreate(context);
        } catch (error) {
            assert.fail(`expected promise resolved, but error was '${error.message}'`);
        }
    });
});

describe('checkUniqueEmail', () => {
    let app;
    let server;

    before(async () => {
        app = await appPromise;
        server = await app.listen(0);
    });

    after((done) => {
        server.close(done);
    });

    afterEach(async () => {
        await testObjects.cleanup();
    });

    const currentEmail = `current.${Date.now()}@account.de`;
    const updatedEmail = `Current.${Date.now()}@Account.DE`;
    const changedEmail = `Changed.${Date.now()}@Account.DE`;
    const mockUser = {
        firstName: 'Test',
        lastName: 'Testington',
        schoolId: '5f2987e020834114b8efd6f8',
    };

    it('fails because of duplicate email', async () => {
        const expectedErrorMessage = `Die E-Mail Adresse ist bereits in Verwendung!`;

        await testObjects.createTestUser({ email: currentEmail });

        const context = {
            app,
            data: {
                ...mockUser,
                email: updatedEmail,
            },
        };

        try {
            await checkUniqueEmail(context);
            assert.fail('should have failed');
        } catch (error) {
            expect(error.message).to.equal(expectedErrorMessage);
            expect(error.code).to.equal(400);
        }
    });

    it('succeeds because of unique email', async () => {
        await testObjects.createTestUser({ email: currentEmail });

        const context = {
            app,
            data: {
                ...mockUser,
                email: changedEmail,
            },
        };

        try {
            await checkUniqueEmail(context);
        } catch (error) {
            assert.fail(`expected promise resolved, but error was '${error.message}'`);
        }
    });

    it('succeeds because nothing to do (no email)', async () => {
        await testObjects.createTestUser({ email: currentEmail });

        const context = {
            app,
            data: {
                ...mockUser,
            },
        };

        try {
            await checkUniqueEmail(context);
        } catch (error) {
            assert.fail(`expected promise resolved, but error was '${error.message}'`);
        }
    });
});

describe('decorateUsers', () => {
    const service = {
        find: sinon.spy(),
    };

    // const serviceSpy = sinon.spy(service, 'find');
    const hookMock = {
        app: {
            // eslint-disable-next-line no-unused-vars
            service(url) {
                return service;
            },
        },
        result: {
            constructor: {
                name: '',
            },
        },
    };

    it('should call roles service exactly once', async () => {
        await decorateUsers(hookMock);
        assert(service.find.calledOnce);
    });
});
