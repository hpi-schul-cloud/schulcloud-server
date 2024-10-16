import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { MongoPatterns } from '@shared/repo';
import { Scope } from '@shared/repo/scope';
import { UserDiscoverableQuery } from '@src/modules/user/service/user-query.type';

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

	byRoleId(roleId?: EntityId): UserScope {
		if (roleId !== undefined) {
			this.addQuery({ roles: roleId });
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

	withDiscoverableTrue(query?: UserDiscoverableQuery): UserScope {
		if (query === 'true') {
			this.addQuery({ discoverable: true });
		}
		if (query === 'not-false') {
			this.addQuery({ discoverable: { $ne: false } });
		}
		return this;
	}

	withDeleted(deleted?: boolean): UserScope {
		if (!deleted) {
			this.addQuery({ $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] });
		}
		return this;
	}
}
