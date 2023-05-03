import { Injectable } from '@nestjs/common';
import { IAccount } from '@shared/domain';
import { AccountDto } from '../services/dto/account.dto';

@Injectable()
export abstract class AccountIdmToDtoMapper {
	abstract mapToDto(account: IAccount): AccountDto;
}
