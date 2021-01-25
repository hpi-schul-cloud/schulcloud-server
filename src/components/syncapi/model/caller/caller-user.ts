import {InternalUser} from "../internal/internal-user";

/**
 * Target entity for the user model of the SYNC API.
 */
export class CallerUser {
    id: string;
    accountEnabled: boolean;
    birthday: string;
    displayName: string;
    givenName: string;
    roles: string[];
    surname: string;
    userPrincipalName: string;
}
