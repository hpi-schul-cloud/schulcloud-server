import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo';
import { UserLicenseEntity, UserLicenseType } from '../entity';

export class UserLicenseScope extends Scope<UserLicenseEntity> {
	public byType(type?: UserLicenseType): this {
		if (!type) {
			return this;
		}
		this.addQuery({ type });

		return this;
	}

	public byUserId(userId?: EntityId): this {
		if (!userId) {
			return this;
		}
		this.addQuery({ user: userId });

		return this;
	}
}
