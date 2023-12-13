import { Injectable } from '@nestjs/common';
import { IdmAccount } from '@shared/domain';
import { Account } from '../../domain/account';

@Injectable()
export abstract class AccountIdmToDoMapper {
	abstract mapToDo(account: IdmAccount): Account;
}
