import { Account, EntityId, IAccountProperties } from '@shared/domain';

import { ObjectId } from 'bson';
import { DeepPartial } from 'fishery';
import { BaseEntityTestFactory } from './base-entity-test.factory';

class AccountFactory extends BaseEntityTestFactory<Account, IAccountProperties> {
	withSystemId(id: EntityId | ObjectId): this {
		const params: DeepPartial<IAccountProperties> = { systemId: id };
		return this.params(params);
	}
}

export const accountFactory = AccountFactory.define(Account, ({ sequence }) => {
	return {
		username: `account #${sequence}`,
		userId: new ObjectId(),
	};
});
