import { IAccount } from '@shared/domain';
import { AccountDto } from '../services/dto/account.dto';
import { AccountIdmToDtoMapper } from './account-idm-to-dto.mapper.abstract';

export class AccountIdmToDtoMapperDb extends AccountIdmToDtoMapper {
	mapToDto(account: IAccount): AccountDto {
		const createdDate = account.createdDate ? account.createdDate : new Date();
		return new AccountDto({
			id: account.attRefTechnicalId ?? '',
			idmReferenceId: account.id,
			userId: account.attRefFunctionalIntId,
			systemId: account.attRefFunctionalExtId,
			username: account.username ?? '',
			createdAt: createdDate,
			updatedAt: createdDate,
		});
	}
}
