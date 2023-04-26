import { Account, EntityId, IAccountProperties } from '@shared/domain';

import { ObjectId } from 'bson';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

class AccountFactory extends BaseFactory<Account, IAccountProperties> {
	withSystemId(id: EntityId | ObjectId): this {
		const params: DeepPartial<IAccountProperties> = { systemId: id };

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
