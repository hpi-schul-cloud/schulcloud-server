import {Application} from "@feathersjs/express";
import {InternalUser, CallerUser} from "../model";

export class UsersProxyService {
    constructor(private app: Application) { }

    async find() {
        // call the existing user service
        const response = await this.app.service('/users').find()
        const { data } = response;
        // map the response to the expected json schema
        return await this.mapResponse(data)
    }

    async get(userId: string) {
        // query the userservice with the provided userId
        const result = await this.app.service('/users').find({query: { _id: userId }});
        // return empty set when the user is not found
        if(result.data.length == 0) return [];
        // destruct the data property, this is the usermodel
        const [ foundUser ] = result.data;
        // get account details to check if account is enabled
        const account = await this.getAccountDetails(foundUser);
        const isEnabled = account[0].activated !== undefined ? account[0].activated : false;
        const callerUser: CallerUser = UsersProxyService.mapInternalUserToCallerUser(foundUser, foundUser.email, isEnabled);
        return callerUser
    }

    async create(data: CallerUser, params) {
        // transform the user to the userschema used in the application
        // TODO: Discuss about default values for avatar and how to determine schoolId
        const userData = {callerUser: data, schoolId: this.getSchoolId(), avatarInitials: "avatar", avatarBackgroundColor: "avatar"}
        const scUser = new InternalUser(userData);
        // FIXME: issue with creation: 'Der Pin wurde noch nicht bei der Registrierung eingetragen.'
        const createdUser = await this.app.service('/users').create(scUser)
        const callerUser: CallerUser = UsersProxyService.mapInternalUserToCallerUser(createdUser, createdUser.email, true);
        return [];
    }

    async patch(userId, data: CallerUser, params) {
        const userData = {callerUser: data, schoolId: this.getSchoolId(), avatarInitials: 'avatar', avatarBackgroundColor: 'avatar'}
        // create userschema to update the original user schema properties
        const scUser = new InternalUser(userData);
        // update
        const updatedUser = await this.app.service('users').patch(userId, scUser);
        // transform userschema to new schema and return it
        const callerUser: CallerUser = UsersProxyService.mapInternalUserToCallerUser(updatedUser, updatedUser.email, updatedUser.isEnabled);
        return callerUser;
    }

    async remove(userId: string, params) {
        // deactivate account via account service => activated == false
        const accounts = await this.app.service('accounts').find({ query: { userId } });
        await this.app.service('accounts').patch(accounts[0]._id, { activated: false }, { query: { userId } });
        // return the updated user
        return await this.get(userId);
        // TODO: If deactivating the account is not sufficient, we need to delegate deletion to user service for provided userId
        // return await this.app.service('/users').remove(userId)
    }

    private async mapResponse(data: any): Promise<CallerUser[]> {
        const mappedResponse: CallerUser[] = [];
        for (const scUser of data) {
            const account = await this.getAccountDetails(scUser)
            const isEnabled = account[0]?.activated !== undefined ? account[0].activated : false;
            const callerUser: CallerUser = UsersProxyService.mapInternalUserToCallerUser(scUser, scUser.email, isEnabled);
            mappedResponse.push(callerUser);
        }
        return mappedResponse;
    }

    private getSchoolId() {
        return '5f2987e020834114b8efd6f8';
    }

    private async getAccountDetails(scUser: any) {
        return await this.app.service('accounts').find({query: {userId: scUser.id}});
    }

    static mapInternalUserToCallerUser(internalUser: InternalUser, userPrincipalName: string, isEnabled: boolean): CallerUser {
        const callerUser = new CallerUser()
        callerUser.id = internalUser._id
        callerUser.accountEnabled = isEnabled
        callerUser.birthday = internalUser.birthday
        callerUser.displayName = internalUser.displayName
        callerUser.givenName = internalUser.firstName
        callerUser.roles = internalUser.roles
        callerUser.surname = internalUser.lastName
        callerUser.userPrincipalName = userPrincipalName
        return callerUser
    }
}
