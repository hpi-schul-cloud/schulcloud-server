import { IdmAccount } from '@shared/domain';
import { AccountDto } from '../services/dto/account.dto';
import { AccountIdmToDtoMapper } from './account-idm-to-dto.mapper.abstract';

export class AccountIdmToDtoMapperIdm extends AccountIdmToDtoMapper {
	mapToDto(account: IdmAccount): AccountDto {
		const createdDate = account.createdDate ? account.createdDate : new Date();
		return new AccountDto({
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
