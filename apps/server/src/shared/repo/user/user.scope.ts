import { Scope } from '@shared/repo';
import { EntityId, User } from '@shared/domain';

export class UserScope extends Scope<User> {
	isOutdated(isOutdated?: boolean): UserScope {
		if (isOutdated !== undefined) {
			this.addQuery({ outdatedSince: { $exists: isOutdated } });
		}
		return this;
	}

	hasPreviousExternalId(hasPreviousExternalId?: boolean): UserScope {
		if (hasPreviousExternalId !== undefined) {
			this.addQuery({ previousExternalId: { $exists: hasPreviousExternalId } });
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
