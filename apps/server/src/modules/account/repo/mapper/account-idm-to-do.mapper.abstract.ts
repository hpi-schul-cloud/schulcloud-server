import { Injectable } from '@nestjs/common';
import { IdmAccount } from '@shared/domain/interface';
import { Account } from '../../domain/account';

@Injectable()
export abstract class AccountIdmToDoMapper {
	public abstract mapToDo(account: IdmAccount): Account;
}
