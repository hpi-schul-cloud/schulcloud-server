import { Injectable } from '@nestjs/common';
import { IdmAccount } from '../../domain';
import { Account } from '../../domain/account';

@Injectable()
export abstract class AccountIdmToDoMapper {
	abstract mapToDo(account: IdmAccount): Account;
}
