/* istanbul ignore file */
import { Account, EntityId, IdmAccountProperties, User } from '@shared/domain';

import { ObjectId } from 'bson';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

export const defaultTestPassword = 'DummyPasswd!1';
export const defaultTestPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';
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

	withAllProperties(): this {
		return this.params({
			userId: new ObjectId(),
			username: 'username',
			activated: true,
			credentialHash: 'credentialHash',
			expiresAt: new Date(),
			lasttriedFailedLogin: new Date(),
			password: defaultTestPassword,
			systemId: new ObjectId(),
			token: 'token',
		}).afterBuild((acc) => {
			return {
				...acc,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
		});
	}

	withoutSystemAndUserId(): this {
		return this.params({
			username: 'username',
			systemId: undefined,
			userId: undefined,
		});
	}
}

// !!! important username should not be contain a space !!!
export const accountFactory = AccountFactory.define(Account, ({ sequence }) => {
	return {
		username: `account${sequence}`,
		password: defaultTestPasswordHash,
		userId: new ObjectId(),
	};
});
