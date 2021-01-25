/**
 * Entity of the original user which is responded from the Userservice.
 */
export class InternalUser {
    _id?: string;
    roles?: string[];
    schoolId?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    displayName?: string;
    birthday?: string;
    avatarInitials?: string;
    avatarBackgroundColor?: string;
    email?: string;

    constructor ({callerUser, schoolId, avatarInitials, avatarBackgroundColor}) {
        if (callerUser.id) this._id = callerUser.id
        if (callerUser.roles) this.roles = callerUser.roles
        if (schoolId) this.schoolId = schoolId
        if (callerUser.givenName) this.firstName = callerUser.givenName
        if (callerUser.surname) this.lastName = callerUser.surname
        if (callerUser.givenName && callerUser.surname) this.fullName = `${callerUser.givenName} ${callerUser.surname}`
        if (callerUser.displayName) this.displayName = callerUser.displayName
        if (callerUser.birthday) this.birthday = callerUser.birthday
        if (avatarInitials) this.avatarInitials = avatarInitials
        if (avatarBackgroundColor) this.avatarBackgroundColor = avatarBackgroundColor
        if (callerUser.userPrincipalName) this.email = callerUser.userPrincipalName
    }
}
