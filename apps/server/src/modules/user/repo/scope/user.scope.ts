import { EntityId } from '@shared/domain/types';
import { MongoPatterns } from '@shared/repo/mongo.patterns';
import { Scope } from '@shared/repo/scope';
import { UserDiscoverableQuery } from '../../domain/query/user-query';
import { User } from '../user.entity';

export class UserScope extends Scope<User> {
	public isOutdated(isOutdated?: boolean): UserScope {
		if (isOutdated !== undefined) {
			this.addQuery({ outdatedSince: { $exists: isOutdated } });
		}
		return this;
	}

	public whereLastLoginSystemChangeSmallerThan(date?: Date): UserScope {
		if (date) {
			this.addQuery({ $or: [{ lastLoginSystemChange: { $lt: date } }, { lastLoginSystemChange: { $exists: false } }] });
		}
		return this;
	}

	public whereLastLoginSystemChangeIsBetween(startDate?: Date, endDate?: Date): UserScope {
		if (startDate && endDate) {
			this.addQuery({
				lastLoginSystemChange: { $gte: startDate, $lt: endDate },
			});
		}
		return this;
	}

	public withOutdatedSince(date?: Date): UserScope {
		if (date) {
			this.addQuery({ outdatedSince: { $eq: date } });
		}
		return this;
	}

	public bySchoolId(schoolId?: EntityId): UserScope {
		if (schoolId !== undefined) {
			this.addQuery({ school: schoolId });
		}
		return this;
	}

	public byRoleId(roleId?: EntityId): UserScope {
		if (roleId !== undefined) {
			this.addQuery({ roles: roleId });
		}
		return this;
	}

	public byName(name?: string): UserScope {
		if (name !== undefined) {
			const escapedName = name.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
			this.addQuery({ $or: [{ firstName: new RegExp(escapedName, 'i') }, { lastName: new RegExp(escapedName, 'i') }] });
		}
		return this;
	}

	public withDiscoverableTrue(query?: UserDiscoverableQuery): UserScope {
		if (query === UserDiscoverableQuery.TRUE) {
			this.addQuery({ discoverable: true });
		}
		if (query === UserDiscoverableQuery.NOT_FALSE) {
			this.addQuery({ discoverable: { $ne: false } });
		}
		return this;
	}

	public withDeleted(deleted?: boolean): UserScope {
		if (!deleted) {
			this.addQuery({ $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] });
		}
		return this;
	}
}
