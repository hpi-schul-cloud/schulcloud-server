import { ObjectId } from '@mikro-orm/mongodb';
import { StringValidator } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { MongoDbScope, MongoPatterns } from '@shared/repo';
import { GroupEntity, GroupEntityTypes } from '../entity';
import { GroupTypes } from './group-types';
import { GroupVisibilityPermission } from './group-visibility-permission.enum';

export class GroupAggregateScope extends MongoDbScope<GroupEntity> {
	byUserPermission(userId: EntityId, schoolId: EntityId, permission: GroupVisibilityPermission): this {
		if (permission === GroupVisibilityPermission.ALL_SCHOOL_GROUPS) {
			this.byOrganization(schoolId);
		} else if (permission === GroupVisibilityPermission.ALL_SCHOOL_CLASSES) {
			this.pipeline.push({
				$match: {
					$or: [
						{ organization: new ObjectId(schoolId), type: GroupEntityTypes.CLASS },
						{ users: { $elemMatch: { user: new ObjectId(userId) } } },
					],
				},
			});
		} else {
			this.byUser(userId);
		}

		return this;
	}

	byAvailableForSync(value: boolean | undefined): this {
		if (value) {
			this.pipeline.push(
				{
					$match: {
						$or: [
							{ type: { $eq: GroupTypes.CLASS } },
							{ type: { $eq: GroupTypes.COURSE } },
							{ type: { $eq: GroupTypes.OTHER } },
						],
					},
				},
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

	byUser(id: EntityId | undefined): this {
		if (id) {
			this.pipeline.push({ $match: { users: { $elemMatch: { user: new ObjectId(id) } } } });
		}

		return this;
	}

	byOrganization(id: EntityId | undefined): this {
		if (id) {
			this.pipeline.push({ $match: { organization: new ObjectId(id) } });
		}

		return this;
	}

	byName(nameQuery: string | undefined): this {
		const escapedName: string | undefined = nameQuery
			?.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '')
			.trim();

		if (StringValidator.isNotEmptyString(escapedName, true)) {
			this.pipeline.push({ $match: { name: { $regex: escapedName, $options: 'i' } } });
		}

		return this;
	}
}
