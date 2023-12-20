import { IdmAccount } from '@shared/domain/interface';
import { Account } from '../../domain/account';
import { AccountIdmToDoMapper } from './account-idm-to-do.mapper.abstract';

export class AccountIdmToDoMapperIdm extends AccountIdmToDoMapper {
	mapToDo(account: IdmAccount): Account {
		return new Account({
			id: account.id,
			idmReferenceId: undefined,
			systemId: account.attDbcSystemId,
			userId: account.attDbcUserId,
			username: account.username ?? '',
			createdAt: account.createdDate ? account.createdDate : new Date(),
		});
	}
}
