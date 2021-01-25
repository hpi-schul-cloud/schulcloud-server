import {InternalUser, CallerUser} from "../../../../src/components/syncapi/model";
import {UsersProxyService} from "../../../../src/components/syncapi/service";

describe('User Sync API', () => {
    let app;
    let server;
    let usersProxyService;
    let userService;

    const {expect} = require('chai');
    const appPromise = require('../../../../src/app');
    const testObjects = require('../../../services/helpers/testObjects')(appPromise);

    before(async () => {
        app = await appPromise;
        usersProxyService = app.service(`/syncapi/v1/users`);
        userService = app.service(`/users`);
        server = await app.listen(0);
    });

    after(async(done) => {
        await testObjects.cleanup();
        await server.close();
    });

    it('Sync Proxy maps all Users in callerUser Format', async () => {
        const callerUsers = await usersProxyService.find();
        const internalUsers = await userService.find();
        expect(internalUsers.data).to.have.lengthOf(callerUsers.length);
    });

    it('Sync Proxy displays a User in callerUser Format', async () => {
        const internalUsers = await userService.find();
        const callerUser = await usersProxyService.get(internalUsers.data[0].id);
        expect(internalUsers.data.map(internalUser => internalUser._id.toString())).to.include(callerUser.id.toString());
    });

    it('Sync Proxy cannot find Unknown User', async () => {
        let unknownId = '000000000000000000000000';
        let unknownUser: CallerUser = usersProxyService.get(unknownId);
        if (unknownUser.id) {
            throw Error(`User got found for unknown ID ${unknownUser.id}`)
        }
    });

    /* TODO: 'Der Pin wurde noch nicht bei der Registrierung eingetragen.' - How can we skip registration?
    it('Sync Proxy creates a User from Target User Format', async () => {
        const callerUser: callerUser = new callerUser();
        callerUser.displayName = "Test User"
        callerUser.userPrincipalName = "test@user.de"
        const createdUser = await UsersProxyService.create(callerUser);
        expect(createdUser.userPrincipalName).to.equal( callerUser.userPrincipalName );
        await UsersProxyService.remove(callerUser.id, {});
    });*/

    it('Sync Proxy patches a User from Target User Format', async () => {
        const internalUser: InternalUser = (await userService.find()).data[0];
        const callerUser: CallerUser = UsersProxyService.mapInternalUserToCallerUser(internalUser, 'test@user.de', true);
        const patchedUser: CallerUser = await usersProxyService.patch(internalUser._id, callerUser);
        expect(patchedUser.userPrincipalName).to.equal( callerUser.userPrincipalName );
    });

    it('Sync Proxy cannot create a invalid User ID by patching an unknown User', async () => {
        const unknownId = 'This is not a real ID';
        const internalUser: InternalUser = (await userService.find()).data[0];
        const callerUser: CallerUser = UsersProxyService.mapInternalUserToCallerUser(internalUser, 'test@user.de', true);
        callerUser.id = unknownId;
        let patchedUser: CallerUser;
        try {
            patchedUser = await usersProxyService.patch(unknownId, callerUser);
        } catch(err) {
            expect(err.value).to.equal(unknownId);
        }
        if (patchedUser) {
            throw Error(`Proxy was able to set a invalid User ID ${patchedUser.id}`)
        }
    });

    it('Sync Proxy cannot patch User Email into illegal State', async () => {
        const invalidEmail = 'this is not a @ valid. Email Format'
        const internalUser: InternalUser = (await userService.find()).data[0];
        const callerUser: CallerUser = UsersProxyService.mapInternalUserToCallerUser(internalUser, invalidEmail, true);
        let patchedUser: CallerUser;
        try {
            patchedUser = await usersProxyService.patch(internalUser._id, callerUser);
        } catch(err) {
            // Expecting Bad Request since Email is in invalid Format
            expect(err.code).to.equal(400);
        }
        if (patchedUser) {
            throw Error(`Proxy was able to set a invalid User ID ${patchedUser.id}`)
        }
    });

    // TODO: Is deactivation of account sufficient or should the user be deleted?
    it('Sync Proxy removes a User from Target User Format', async () => {
        const internalUser: InternalUser = (await userService.find()).data[0];
        const callerUser: CallerUser = UsersProxyService.mapInternalUserToCallerUser(internalUser, internalUser.email, true);
        const removedUser: CallerUser = await usersProxyService.remove(callerUser.id, callerUser);
        const searchForRemovedUser: CallerUser = await usersProxyService.get(removedUser.id);
        expect(searchForRemovedUser.accountEnabled).to.equal(false);
    });

    it('Sync only deletes the User that was defined by Request', async () => {
        const initialUsers: InternalUser[] = (await userService.find()).data;
        const internalUser = initialUsers[0];
        const callerUser: CallerUser = UsersProxyService.mapInternalUserToCallerUser(internalUser, internalUser.email, true);
        const removedUser: CallerUser = await usersProxyService.remove(callerUser.id, callerUser);
        const newUsers: InternalUser[] = (await userService.find()).data;
        // Expectation: Nothing changed except removed User
        expect(newUsers.filter(user => user._id === removedUser.id)).to.deep.equal(initialUsers.filter(user => user._id === removedUser.id));
    });
})
