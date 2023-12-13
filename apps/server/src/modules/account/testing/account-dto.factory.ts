import { BaseFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { AccountDto } from '../services';

export const accountDtoFactory = BaseFactory.define<AccountDto, AccountDto>(AccountDto, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
		username: `Username-${sequence}`,
	};
});
