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

	public byName(name?: string, allowedMaxLength = 100): UserScope {
		if (name !== undefined) {
			// To avoid ressource expensive operations with passing unexpected long name.
			this.checkMaxLength(name, allowedMaxLength);

			const escapedName = this.escapeString(name);
			const searchNameRegex = new RegExp(escapedName, 'i');
			this.addQuery({ $or: [{ firstName: searchNameRegex }, { lastName: searchNameRegex }] });
		}

		return this;
	}

	private escapeString(value: string): string {
		const escaped = value.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '');
		const escapedAndTrimed = escaped.trim();

		return escapedAndTrimed;
	}

	private checkMaxLength(value: string, allowedMaxLength: number): void {
		if (value.length > allowedMaxLength) {
			throw new Error('Seached value is too long');
		}
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
			this.addQuery({
				$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }, { deletedAt: { $gte: new Date() } }],
			});
		}

		return this;
	}
}
