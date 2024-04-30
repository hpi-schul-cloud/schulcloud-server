import { EntityId } from '@shared/domain/types';
import { UserLicenseType } from '../entity';

export type UserLicenseQuery = {
	type?: UserLicenseType;
	userId?: EntityId;
};
