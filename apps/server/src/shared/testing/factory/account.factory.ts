/* istanbul ignore file */
/*
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { Account } from '@src/modules/account';
import { ObjectId } from 'bson';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

export const defaultTestPassword = 'DummyPasswd!1';
export const defaultTestPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';
// !!! important username should not be contain a space !!!
// export const AccountFactory =  DomainObjectFactory.define<Account, IdmAccountProperties > (Account, ({ param:any }) => {{
// 		return {
// 			username: `account${param.id}`,
// 			password: defaultTestPasswordHash,
// 			userId: new ObjectId(),
// 			systemId: new ObjectId(param.id),
// 		};
// 	}
// });

// export const AccountFactory =  DomainObjectFactory.define<Account, User > (Account, ({ param }) => {{
// 	return {
// 		username: `account${param.id}`,
// 		password: defaultTestPasswordHash,
// 		userId: new ObjectId(),
// 		systemId: new ObjectId(param.id),
// 	};
// }
// });

// class AccountFactory extends BaseFactory<AccountEntity, IdmAccountProperties> {
// 	withSystemId(id: EntityId | ObjectId): this {
// 		const params: DeepPartial<IdmAccountProperties> = { systemId: new ObjectId(id) };

// 		return this.params(params);
// 	}

// 	withUser(user: User): this {
// 		if (!user.id) {
// 			throw new Error('User does not have an id.');
// 		}

// 		const params: DeepPartial<IdmAccountProperties> = { userId: new ObjectId(user.id) };

// 		return this.params(params);
// 	}
// }

// export class AccountFactory {
// 	public static withSystemId(id: EntityId | ObjectId): Account {
// 		return {
// 			userId: userId.toHexString(),
// 			username: `Username-${userId.toHexString()}`,
// 			createdAt: new Date(),
// 			updatedAt: new Date(),
// 			systemId: id.toString(),
// 		};
// 	}

// 	public static withUser(user: User): Account {
// 		if (!user.id) {
// 			throw new Error('User does not have an id.');
// 		}
// 		return {
// 			userId: user.id,
// 			username: `Username-${user.id}`,
// 			createdAt: new Date(),
// 			updatedAt: new Date(),
// 		};
// 	}
// }

// export const accountFactory = DomainObjectFactory.define<Account, AccountProps>(Account, ({ sequence }) => {
//	return { ...param };
// });

class AccountFactory extends BaseFactory<Account, Account> {
	withSystemId(id: EntityId | ObjectId): this {
		const params: DeepPartial<Account> = { systemId: id.toString() };
		return this.params(params); // this.params({ systemId: id.toString() });
	}

	withUser(user: User): this {
		const params: DeepPartial<Account> = { userId: user.id };
		return this.params(params); // this.params({ userId: user.id });
	}
}

export const accountFactory = AccountFactory.define(Account, ({ sequence }) => {
	return {
		username: `Username-${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
		password: defaultTestPasswordHash,
	};
});
*/
