const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const { BadRequest } = require('@feathersjs/errors');
const { setupUser, deleteUser } = require('../helper/helper.user');
const hooks = require('../../../../src/services/teams/hooks/index.js');
const { filterToRelated } = require('../../../../src/services/teams/hooks/index.js');
const app = require('../../../../src/app');
const { createHook } = require('../helper/helper.hook');


describe('Team service hook tests.', () => {
    let server;

    before((done) => {
        server = app.listen(0, done);
    });

    after((done) => {
        server.close(done);
    });

    describe.skip('sendInfo', () => {
    });

    describe('filterToRelated', () => {
        let getDeepCopy;
        before(() => {
            const key1 = {
                deepKey1: '<value>',
                deepKey2: '<value>',
                deepKey3: '<value>',
            };
            const key2 = {
                deepKey1: '<value>',
            };
            const key3 = {
                deepKey1: '<value>',
            };
            const baseHook = createHook(app, {
                type: 'after',
                result: {
                    key1,
                    key2,
                    key3,
                },
            });

            getDeepCopy = () => {
                const copy = Object.assign({}, baseHook);
                baseHook.result = {     // create 4 new Objects and override
                    key1: Object.assign({}, key1),
                    key2: Object.assign({}, key2),
                    key3: Object.assign({}, key3),
                };
                return copy;
            };
        });
        it('should work for keys as string, deep path as string', () => {
            const filterToRelatedInstance = filterToRelated('deepKey1', 'result.key1');
            const output = filterToRelatedInstance(getDeepCopy());
            const outputExpected = getDeepCopy();
            delete outputExpected.result.key1.deepKey2;
            delete outputExpected.result.key1.deepKey3;
            expect(output).to.deep.equal(outputExpected);
        });

        it('should work for keys as array, deep path as string', () => {
            const filterToRelatedInstance = filterToRelated(['deepKey1', 'deepKey2'], 'result.key1');
            const output = filterToRelatedInstance(getDeepCopy());
            const outputExpected = getDeepCopy();
            delete outputExpected.result.key1.deepKey3;
            expect(output).to.deep.equal(outputExpected);
        });

        it('should work for keys as array, normal path as string', () => {
            const filterToRelatedInstance = filterToRelated(['key1', 'key2'], 'result');
            const output = filterToRelatedInstance(getDeepCopy());
            const outputExpected = getDeepCopy();
            delete outputExpected.result.key3;
            expect(output).to.deep.equal(outputExpected);
        });

        it('should pass local request without changes', () => {
            const filterToRelatedInstance = filterToRelated(['key1', 'key2'], 'result');
            const testHook = getDeepCopy();
            delete testHook.params.provider; // set to local request
            const output = filterToRelatedInstance(testHook);
            const outputExpected = getDeepCopy();
            expect(output).to.deep.equal(outputExpected);
        });

        it('should NOT pass local request without changes if it is disabled', () => {
            const filterToRelatedInstance = filterToRelated(['key1', 'key2'], 'result', false);
            const testHook = getDeepCopy();
            delete testHook.params.provider; // set to local request
            const output = filterToRelatedInstance(testHook);
            const outputExpected = getDeepCopy();
            delete outputExpected.result.key3;
            expect(output).to.deep.equal(outputExpected);
        });

        it('should try an error becouse result is not updated', () => {
            const filterToRelatedInstance = filterToRelated(['key1', 'key2'], 'result');
            const testHook = getDeepCopy();
            delete testHook.params.provider; // set to local request
            const output = filterToRelatedInstance(testHook);
            const outputExpected = getDeepCopy();
            delete outputExpected.result.key3;
            expect(output).to.not.deep.equal(outputExpected);
        });

        it.skip('should work for path as array', () => {
            // todo
        });
    });
});
