import { Account, User } from '@shared/domain';
import { Scope } from '../scope';

export class AccountScope extends Scope<Account> {
	byUser(user: User): AccountScope {
		this.addQuery({ user });
		return this;
	}
}
