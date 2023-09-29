import { Injectable } from '@nestjs/common';
import { IdmAccount } from '@shared/domain';
import { AccountDto } from '../services/dto/account.dto';

@Injectable()
export abstract class AccountIdmToDtoMapper {
	abstract mapToDto(account: IdmAccount): AccountDto;
}
