/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export { AccountModule } from './account.module';
export { Account, AccountSave } from './domain';
export { AccountService } from './domain/services';
