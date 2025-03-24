import { Account, IdmAccount } from '../do';
import { AccountIdmToDoMapper } from './account-idm-to-do.mapper.abstract';

export class AccountIdmToDoMapperIdm extends AccountIdmToDoMapper {
	public mapToDo(account: IdmAccount): Account {
		const createdDate = account.createdDate ? account.createdDate : new Date();
		return new Account({
			id: account.id,
			idmReferenceId: undefined,
			userId: account.attDbcUserId,
			systemId: account.attDbcSystemId,
			username: account.username ?? '',
			createdAt: createdDate,
			updatedAt: createdDate,
		});
	}
}
