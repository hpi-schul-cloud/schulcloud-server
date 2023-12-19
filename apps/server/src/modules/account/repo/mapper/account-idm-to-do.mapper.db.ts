import { IdmAccount } from '../../domain';
import { Account } from '../../domain/account';
import { AccountIdmToDoMapper } from './account-idm-to-do.mapper.abstract';

export class AccountIdmToDoMapperDb extends AccountIdmToDoMapper {
	mapToDo(account: IdmAccount): Account {
		return new Account({
			id: account.attDbcAccountId,
			idmReferenceId: account.id,
			systemId: account.attDbcSystemId,
			userId: account.attDbcUserId,
			username: account.username ?? '',
			createdAt: account.createdDate ? account.createdDate : new Date(),
			updatedAt: account.createdDate,
		});
	}
}
