import { Injectable } from '@nestjs/common';
import { Account } from '../do/account';
import { IdmAccount } from '../do/idm-account';

@Injectable()
export abstract class AccountIdmToDoMapper {
	public abstract mapToDo(account: IdmAccount): Account;
}
