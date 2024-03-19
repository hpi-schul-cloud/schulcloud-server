/* istanbul ignore file */
import { Account, IdmAccountProperties, User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

import { ObjectId } from '@mikro-orm/mongodb';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

class AccountFactory extends BaseFactory<Account, IdmAccountProperties> {
	withSystemId(id: EntityId | ObjectId): this {
		const params: DeepPartial<IdmAccountProperties> = { systemId: id };

		return this.params(params);
	}

	withUser(user: User): this {
		if (!user.id) {
			throw new Error('User does not have an id.');
		}

		const params: DeepPartial<IdmAccountProperties> = { userId: user.id };

		return this.params(params);
	}
}

export const defaultTestPassword = 'DummyPasswd!1';
export const defaultTestPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';
// !!! important username should not be contain a space !!!
export const accountFactory = AccountFactory.define(Account, ({ sequence }) => {
	return {
		username: `account${sequence}`,
		password: defaultTestPasswordHash,
		userId: new ObjectId(),
	};
});
