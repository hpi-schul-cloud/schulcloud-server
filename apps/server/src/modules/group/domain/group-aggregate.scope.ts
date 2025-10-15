import { ObjectId } from '@mikro-orm/mongodb';
import { StringValidator } from '@shared/common/validator';
import { EntityId } from '@shared/domain/types';
import { MongoPatterns } from '@shared/repo/mongo.patterns';
import { MongoDbScope } from '@shared/repo/mongodb-scope';
import { GroupEntity } from '../entity';
import { GroupTypes } from './group-types';

export class GroupAggregateScope extends MongoDbScope<GroupEntity> {
	public byAvailableForSync(value: boolean | undefined): this {
		if (value) {
			this.byType([GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER]);

			this.pipeline.push(
				{
					$lookup: {
						from: 'courses',
						localField: '_id',
						foreignField: 'syncedWithGroup',
						as: 'syncedCourses',
					},
				},
				{
					$match: {
						$or: [{ syncedCourses: { $size: 0 } }, { type: { $eq: GroupTypes.CLASS } }],
					},
				}
			);
		}

		return this;
	}

	public byUser(id: EntityId | undefined): this {
		if (id) {
			this.pipeline.push({ $match: { users: { $elemMatch: { user: new ObjectId(id) } } } });
		}

		return this;
	}

	public byOrganization(id: EntityId | undefined): this {
		if (id) {
			this.pipeline.push({ $match: { organization: new ObjectId(id) } });
		}

		return this;
	}

	public byName(nameQuery: string | undefined): this {
		const escapedName: string | undefined = nameQuery
			?.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '')
			.trim();

		if (StringValidator.isNotEmptyStringWhenTrimed(escapedName)) {
			this.pipeline.push({ $match: { name: { $regex: escapedName, $options: 'i' } } });
		}

		return this;
	}

	public byType(groupTypes: GroupTypes[] | undefined): this {
		if (groupTypes) {
			this.pipeline.push({ $match: { type: { $in: groupTypes } } });
		}

		return this;
	}

	public byUsersAndOrganizationsSchoolId(schoolId: EntityId | undefined): this {
		if (schoolId) {
			this.pipeline.push({
				$lookup: {
					from: 'users',
					localField: 'users.user',
					foreignField: '_id',
					as: 'groupUsers',
				},
			});
			this.pipeline.push({
				$match: {
					$or: [{ 'groupUsers.schoolId': new ObjectId(schoolId) }, { organization: new ObjectId(schoolId) }],
				},
			});
		}

		return this;
	}
}
