import {CallerClassModel, CallerUser, InternalClassModel} from "../../../../src/components/syncapi/model";
import {GroupProxyService} from "../../../../src/components/syncapi/service";

describe('Group Sync API', () => {
    let app;
    let server;
    let groupProxyService;
    let classesService;

    const {expect} = require('chai');
    const appPromise = require('../../../../src/app');
    const testObjects = require('../../../services/helpers/testObjects')(appPromise);

    before(async () => {
        app = await appPromise;
        groupProxyService = app.service(`/syncapi/v1/groups`);
        classesService = app.service(`/classes`);
        server = await app.listen(0);
    });

    after(async(done) => {
        await testObjects.cleanup();
        await server.close();
    });

    it('Sync Proxy maps all Classes in Target Format', async () => {
        const classes = await groupProxyService.find();
        const internalClasses = await classesService.find();
        expect(internalClasses.data).to.have.lengthOf(classes.value.length);
    });

    it('Sync Proxy maps Class in Target Format', async () => {
        const internalClass = (await classesService.find()).data[0];
        const callerClass = await groupProxyService.get(internalClass.id);
        expect(internalClass.id).to.equal(callerClass.id);
    });

    it('Sync Proxy cannot map Class in Target Format if caller is using an invalid ID', async () => {
        const invalidId = 'This is an Invalid ID';
        const internalClass = (await classesService.find()).data[0];
        internalClass.id = invalidId;
        let callerClass: CallerClassModel;
        try {
            callerClass = await groupProxyService.get(internalClass.id);
        } catch(err) {
            // Expecting Bad Request since ID is in invalid Format
            expect(err.value).to.equal(invalidId);
        }
        if (callerClass) {
            throw Error(`Proxy was able to set a invalid Class ID ${callerClass.id}`)
        }

    });

    it('Sync Proxy creates Class in Target Format', async () => {
        const callerClassDummy = new CallerClassModel();
        const callerClass = await groupProxyService.create(callerClassDummy);
        expect(callerClass.displayName).to.equal(callerClassDummy.displayName);
        expect(callerClass.id).to.not.equal(callerClassDummy.id);
    });

    it('Sync Proxy patches Class in Target Format', async () => {
        const internalClass = (await classesService.find()).data[0];
        internalClass.displayName = 'test';
        const mappedCallerClass: CallerClassModel = GroupProxyService.mapToCallerClassModel(internalClass)
        const storedCallerClass = await groupProxyService.patch(mappedCallerClass.id, mappedCallerClass);
        expect(storedCallerClass.displayName).to.equal(mappedCallerClass.displayName);
    });

    it('Sync Proxy cannot patch invalid Class', async () => {
        const invalidId = 'invalidId';
        const internalClass = (await classesService.find()).data[0];
        const mappedCallerClass: CallerClassModel = GroupProxyService.mapToCallerClassModel(internalClass)
        let storedCallerClass;
        try {
            storedCallerClass = await groupProxyService.patch(invalidId, mappedCallerClass);
        } catch (err) {
            // Expecting Bad Request since the requested Class has an invalid ID
            expect(err.code).to.equal(400);
        }
        if (storedCallerClass) {
            throw Error(`Patched unknown Class ${storedCallerClass}`)
        }
    });

    it('Sync Proxy removes Class in Target Format', async () => {
        const internalClass = (await classesService.find()).data[0];
        const removedCallerClass = await groupProxyService.remove(internalClass.id);
        let removedClass;
        try {
            removedClass = await classesService.get(removedCallerClass.id);
        } catch (err) {
            expect(err.code).to.equal(404);
        }
        if (removedClass) {
            throw Error(`Could not delete ${removedClass}`)
        }
    });

})
