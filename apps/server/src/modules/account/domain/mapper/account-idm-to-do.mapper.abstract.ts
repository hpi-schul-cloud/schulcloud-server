import { Injectable } from '@nestjs/common';
import { Account, IdmAccount } from '../do';

@Injectable()
export abstract class AccountIdmToDoMapper {
	public abstract mapToDo(account: IdmAccount): Account;
}
