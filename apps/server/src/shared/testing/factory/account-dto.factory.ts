import { AccountDto } from '@src/modules/account/services/dto';
import { ObjectId } from 'bson';
import { BaseFactory } from './base.factory';

export const accountDtoFactory = BaseFactory.define<AccountDto, AccountDto>(AccountDto, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
		systemId: new ObjectId().toHexString(),
		username: `Username-${sequence}`,
		password: 'password',
		activated: true,
		userId: new ObjectId().toHexString(),
	};
});
