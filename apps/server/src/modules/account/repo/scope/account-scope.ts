import { Scope } from '@shared/repo/scope';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountEntity } from '../account.entity';

export class AccountScope extends Scope<AccountEntity> {
	public byUserIdsAndSystemId(userIds: string[], systemId: string): AccountScope {
		const userIdsAsObjectId = userIds.length > 0 ? userIds.map((id) => new ObjectId(id)) : [];

		this.addQuery({
			$and: [
				{
					userId: { $in: userIdsAsObjectId },
				},
				{ systemId: new ObjectId(systemId) },
			],
		});
		return this;
	}
}
