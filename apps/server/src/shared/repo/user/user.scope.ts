import { Scope } from '@shared/repo';
import { EntityId, User } from '@shared/domain';

export class UserScope extends Scope<User> {
	isOutdated(isOutdated?: boolean): UserScope {
		if (isOutdated !== undefined) {
			this.addQuery({ outdatedSince: { $exists: isOutdated } });
		}
		return this;
	}

	whereLastLoginSystemChangeSmallerThan(date?: Date): UserScope {
		if (date) {
			this.addQuery({ lastLoginSystemChange: { $lt: date } });
		}
		return this;
	}

	withOutdatedSince(date?: Date): UserScope {
		if (date) {
			this.addQuery({ outdatedSince: { $eq: date } });
		}
		return this;
	}

	bySchoolId(schoolId: EntityId | undefined): UserScope {
		if (schoolId !== undefined) {
			this.addQuery({ school: schoolId });
		}
		return this;
	}
}
