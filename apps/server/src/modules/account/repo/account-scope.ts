import { Account } from '@shared/domain/entity';
import { UserIdAndExternalId } from '@shared/domain/interface';
import { Scope } from '@shared/repo';
import { ObjectId } from 'bson';

export class AccountScope extends Scope<Account> {
	byUserIdAndExternalId(userIdAndExternalId: UserIdAndExternalId): AccountScope {
		this.addQuery({
			$and: [
				{ userId: new ObjectId(userIdAndExternalId.userId) },
				{ systemId: new ObjectId(userIdAndExternalId.externalId) },
			],
		});
		return this;
	}
}
