import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { MongoPatterns, Scope } from '@shared/repo';

export class UserScope extends Scope<User> {
	isOutdated(isOutdated?: boolean): UserScope {
		if (isOutdated !== undefined) {
			this.addQuery({ outdatedSince: { $exists: isOutdated } });
		}
		return this;
	}

	whereLastLoginSystemChangeSmallerThan(date?: Date): UserScope {
		if (date) {
			this.addQuery({ $or: [{ lastLoginSystemChange: { $lt: date } }, { lastLoginSystemChange: { $exists: false } }] });
		}
		return this;
	}

	whereLastLoginSystemChangeIsBetween(startDate?: Date, endDate?: Date): UserScope {
		if (startDate && endDate) {
			this.addQuery({
				lastLoginSystemChange: { $gte: startDate, $lt: endDate },
			});
		}
		return this;
	}

	withOutdatedSince(date?: Date): UserScope {
		if (date) {
			this.addQuery({ outdatedSince: { $eq: date } });
		}
		return this;
	}

	bySchoolId(schoolId?: EntityId): UserScope {
		if (schoolId !== undefined) {
			this.addQuery({ school: schoolId });
		}
		return this;
	}

	byName(name?: string): UserScope {
		if (name !== undefined) {
			const escapedName = name.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
			this.addQuery({ $or: [{ firstName: new RegExp(escapedName, 'i') }, { lastName: new RegExp(escapedName, 'i') }] });
		}
		return this;
	}

	withDeleted(deleted?: boolean): UserScope {
		if (!deleted) {
			this.addQuery({ deletedAt: { $exists: false } });
		}
		return this;
	}
}
