import { AccountReadDto } from '@src/modules/account/services/dto/account.dto';
import { AccountResponse } from '../controller/dto';

export class AccountResponseMapper {
	static mapToResponse(account: AccountReadDto): AccountResponse {
		return new AccountResponse({
			id: account.id,
			userId: account.userId?.toString(),
			activated: account.activated,
			username: account.username,
		});
	}
}
