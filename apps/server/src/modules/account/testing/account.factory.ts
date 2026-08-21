/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { type User } from '@modules/user/repo';
import { type EntityId } from '@shared/domain/types';
import { BaseFactory } from '@testing/factory/base.factory';
import { type DeepPartial } from 'fishery';
import { AccountEntity, type AccountProperties } from '../repo';

export const defaultTestPassword = 'DummyPasswd!1';
export const defaultTestPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';
class AccountFactory extends BaseFactory<AccountEntity, AccountProperties> {
	public withSystemId(id: EntityId | ObjectId): this {
		const params: DeepPartial<AccountProperties> = { systemId: id };

		return this.params(params);
	}

	public withUser(user: User): this {
		if (!user.id) {
			throw new Error('User does not have an id.');
		}

		const params: DeepPartial<AccountProperties> = { userId: user.id, username: user.email };

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
