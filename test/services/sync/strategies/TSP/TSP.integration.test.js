const { expect } = require('chai');

const appPromise = require('../../../../../src/app');
const { findSchool, createUserAndAccount } = require('../../../../../src/services/sync/strategies/TSP/TSP');

const TestObjectsGenerator = require('../../../helpers/TestObjectsGenerator');
const { equal: equalIds } = require('../../../../../src/helper/compare').ObjectId;

describe('TSP API integration tests', () => {
    let app;
    let server;
    let tog;

    before(async () => {
        app = await appPromise;
        server = await app.listen(0);
        tog = new TestObjectsGenerator(app);
    });

    after(async () => {
        await tog.cleanup();
        await server.close();
    });

    describe('#findSchool', () => {
        it('should find a school based on its TSP school identifier', async () => {
            const tspIdentifier = '47274';
            const school = await tog.createTestSchool({
                source: 'tsp',
                sourceOptions: { schoolIdentifier: tspIdentifier }
            });
            const foundSchool = await findSchool(app, tspIdentifier);
            expect(equalIds(school._id, foundSchool._id)).to.equal(true);
        });

        it('returns null if no school was found', async () => {
            const foundSchool = await findSchool(app, '63472');
            expect(foundSchool).to.equal(null);
        });

        after(async () => {
            await tog.cleanup();
        });
    });

    describe('#createUserAndAccount', () => {
        it('should create an activated user and account based on the given details', async () => {
            const school = await tog.createTestSchool();
            const userDetails = {
                firstName: 'Thor',
                lastName: 'Heyerdahl',
                email: 'sailing@pacific.ocean',
                schoolId: school._id,
                source: 'tsp',
                sourceOptions: { awesome: true, tspUid: '2345' },
            };
            const roles = ['administrator', 'teacher'];
            const systemId = (await tog.createTestSystem())._id;
            const createdUser = await createUserAndAccount(app, userDetails, roles, systemId);
            tog.createdEntityIds.users.push(createdUser._id);

            expect(createdUser).to.be.ok;
            expect(createdUser.source).to.equal('tsp');
            expect(createdUser.sourceOptions.awesome).to.equal(true);

            const [account] = await app.service('accounts').find({
                query: { userId: createdUser._id },
            });
            tog.createdEntityIds.accounts.push(account._id);
            expect(account.username).to.equal('tsp/2345');
            expect(account.activated).to.equal(true);
        });
    });
});
