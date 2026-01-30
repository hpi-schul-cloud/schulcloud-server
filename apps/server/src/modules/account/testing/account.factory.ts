/* istanbul ignore file */
import { EntityId } from '@shared/domain/types';

import { ObjectId } from '@mikro-orm/mongodb';
import { User } from '@modules/user/repo';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { AccountEntity, IdmAccountProperties } from '../repo';

export const defaultTestPassword = 'DummyPasswd!1';
export const defaultTestPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';
class AccountFactory extends BaseFactory<AccountEntity, IdmAccountProperties> {
	public withSystemId(id: EntityId | ObjectId): this {
		const params: DeepPartial<IdmAccountProperties> = { systemId: id };

		return this.params(params);
	}

	public withUser(user: User): this {
		if (!user.id) {
			throw new Error('User does not have an id.');
		}

		const params: DeepPartial<IdmAccountProperties> = { userId: user.id };

		return this.params(params);
	}

	public withAllProperties(): this {
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

	public withoutSystemAndUserId(): this {
		return this.params({
			username: 'username',
			systemId: undefined,
			userId: undefined,
		});
	}
}

// !!! important username should not be contain a space !!!
export const accountFactory = AccountFactory.define(AccountEntity, ({ sequence }) => {
	return {
		username: `account#${sequence}@example.tld`,
		password: defaultTestPasswordHash,
		userId: new ObjectId(),
	};
});
