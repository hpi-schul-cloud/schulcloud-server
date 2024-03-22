import { Account } from '@shared/domain/entity';
import { Scope } from '@shared/repo';
import { ObjectId } from 'bson';

export class AccountScope extends Scope<Account> {
	byUserIdsAndSystemId(userIds: string[], systemId: string): AccountScope {
		const userIdsAsObjectId = userIds.length > 0 ? userIds.map((id) => new ObjectId(id)) : [];
		this.addQuery({
			$and: [{ userId: { $in: userIdsAsObjectId } }, { systemId: new ObjectId(systemId) }],
		});
		return this;
	}
}
