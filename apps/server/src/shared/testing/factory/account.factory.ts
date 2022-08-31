import { Account, EntityId, IAccountProperties, RoleName } from '@shared/domain';
import { ObjectId } from 'bson';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import { roleFactory } from './role.factory';
import { systemFactory } from './system.factory';

class AccountFactory extends BaseFactory<Account, IAccountProperties> {
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
