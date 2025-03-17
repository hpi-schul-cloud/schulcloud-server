import { Injectable } from '@nestjs/common';
import { Account } from '../account';
import { IdmAccount } from '../idm-account';

@Injectable()
export abstract class AccountIdmToDoMapper {
	public abstract mapToDo(account: IdmAccount): Account;
}
