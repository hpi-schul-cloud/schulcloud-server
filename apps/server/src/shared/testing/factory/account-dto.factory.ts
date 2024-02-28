import { AccountDto } from '@modules/account/services/dto';
import { ObjectId } from '@mikro-orm/mongodb';
import { defaultTestPasswordHash } from './account.factory';
import { BaseFactory } from './base.factory';

export const accountDtoFactory = BaseFactory.define<AccountDto, AccountDto>(AccountDto, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
		systemId: new ObjectId().toHexString(),
		username: `Username-${sequence}`,
		password: defaultTestPasswordHash,
		activated: true,
		userId: new ObjectId().toHexString(),
	};
});
