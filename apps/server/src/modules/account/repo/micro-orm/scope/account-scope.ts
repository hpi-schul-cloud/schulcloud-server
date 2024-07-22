import { Scope } from '@shared/repo';
import { ObjectId } from 'bson';
import { AccountEntity } from '../../../domain/entity/account.entity';

export class AccountScope extends Scope<AccountEntity> {
	byUserIdsAndSystemId(userIds: string[], systemId: string): AccountScope {
		const userIdsAsObjectId = userIds.length > 0 ? userIds.map((id) => new ObjectId(id)) : [];
		this.addQuery({
			$and: [{ userId: { $in: userIdsAsObjectId } }, { systemId: new ObjectId(systemId) }],
		});
		return this;
	}
}
