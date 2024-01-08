/* istanbul ignore file */
import { User } from '@shared/domain/entity';
import { AccountEntity, IdmAccountProperties } from '@src/modules/account/entity';
import { EntityId } from '@shared/domain/types';
import { Account, AccountProps } from '@src/modules/account';
import { ObjectId } from 'bson';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import { DomainObjectFactory } from './domainobject';

export const defaultTestPassword = 'DummyPasswd!1';
export const defaultTestPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';
class AccountFactory extends BaseFactory<AccountEntity, IdmAccountProperties> {
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

// !!! important username should not be contain a space !!!
//export const accountEntityFactory = AccountFactory.define<AccountEntity, IdmAccountProperties>(AccountEntity,({ sequence, params }) => {
	
//	const userId  = params.userId? params.userId : new ObjectId();
//	const systemId =  params.systemId? params.systemId : new ObjectId();
//	return {
		//...params,
//		userId: userId,
//		systemId: systemId,
//		username: params.username || `Username-${sequence}`,
//		createdAt: new Date(),
//		updatedAt: new Date(),
//	};
//});

export const accountEntityFactory = AccountFactory.define(AccountEntity,({ sequence }) => {
	
	return {
		username: `Username-${sequence}`,
	};
});

export const accountFactory = DomainObjectFactory.define<Account, AccountProps>(Account, ({ sequence, params }) => {
	return {
		...params,
		id: params.id || new ObjectId().toHexString(),
		username: params.username || `Username-${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
