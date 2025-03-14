import { Injectable } from '@nestjs/common';
import { Account } from '../../domain/account';
import { IdmAccount } from '../account';

@Injectable()
export abstract class AccountIdmToDoMapper {
	public abstract mapToDo(account: IdmAccount): Account;
}
