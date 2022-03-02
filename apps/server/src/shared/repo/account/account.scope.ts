import { Account, User } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { Scope } from '../scope';

export class AccountScope extends Scope<Account> {
	byUser(user: User): AccountScope {
		const userId = user._id;
		if (!ObjectId.isValid(userId)) throw new Error('invalid user id');
		this.addQuery({ userId });
		return this;
	}
}
