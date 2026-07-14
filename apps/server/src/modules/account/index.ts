/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export * from './account.module';
export * from './domain';
export { AccountService } from './domain/services';
