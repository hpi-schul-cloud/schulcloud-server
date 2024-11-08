import { ObjectId } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '../entity';
import { GroupAggregateScope } from './group-aggregate.scope';
import { GroupTypes } from './group-types';
import { GroupVisibilityPermission } from './group-visibility-permission.enum';

describe(GroupAggregateScope.name, () => {
	const defaultFacetQuery = {
		$facet: {
			data: [{ $skip: 0 }],
			total: [{ $count: 'count' }],
		},
	};

	describe('byUserPermission', () => {
		describe('when the user is allowed to see all groups of a school', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const schoolId = new ObjectId().toString();

				return {
					userId,
					schoolId,
				};
			};

			it('should build the correct query', () => {
				const { userId, schoolId } = setup();

				const result = new GroupAggregateScope()
					.byUserPermission(userId, schoolId, GroupVisibilityPermission.ALL_SCHOOL_GROUPS)
					.build();

				expect(result).toEqual([{ $match: { organization: new ObjectId(schoolId) } }, defaultFacetQuery]);
			});
		});

		describe('when the user is allowed to see his own groups and all classes of a school', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const schoolId = new ObjectId().toHexString();

				return {
					userId,
					schoolId,
				};
			};

			it('should build the correct query', () => {
				const { userId, schoolId } = setup();

				const result = new GroupAggregateScope()
					.byUserPermission(userId, schoolId, GroupVisibilityPermission.ALL_SCHOOL_CLASSES)
					.build();

				expect(result).toEqual([
					{
						$match: {
							$or: [
								{ organization: new ObjectId(schoolId), type: GroupEntityTypes.CLASS },
								{ users: { $elemMatch: { user: new ObjectId(userId) } } },
							],
						},
					},
					defaultFacetQuery,
				]);
			});
		});

		describe('when the user is allowed to only see his own groups', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const schoolId = new ObjectId().toHexString();

				return {
					userId,
					schoolId,
				};
			};

			it('should build the correct query', () => {
				const { userId, schoolId } = setup();

				const result = new GroupAggregateScope()
					.byUserPermission(userId, schoolId, GroupVisibilityPermission.OWN_GROUPS)
					.build();

				expect(result).toEqual([
					{ $match: { users: { $elemMatch: { user: new ObjectId(userId) } } } },
					defaultFacetQuery,
				]);
			});
		});
	});

	describe('byAvailableForSync', () => {
		describe('when filtering for groups that are available for a course synchronization', () => {
			it('should build the correct query', () => {
				const result = new GroupAggregateScope().byAvailableForSync(true).build();

				expect(result).toEqual([
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
					},
					defaultFacetQuery,
				]);
			});
		});

		describe('when no value was given', () => {
			it('should not include the query in the result', () => {
				const result = new GroupAggregateScope().byAvailableForSync(undefined).build();

				expect(result).toEqual([defaultFacetQuery]);
			});
		});
	});

	describe('byOrganization', () => {
		describe('when filtering for an organization of a group', () => {
			it('should build the correct query', () => {
				const schoolId = new ObjectId().toHexString();

				const result = new GroupAggregateScope().byOrganization(schoolId).build();

				expect(result).toEqual([{ $match: { organization: new ObjectId(schoolId) } }, defaultFacetQuery]);
			});
		});

		describe('when no value was given', () => {
			it('should not include the query in the result', () => {
				const result = new GroupAggregateScope().byOrganization(undefined).build();

				expect(result).toEqual([defaultFacetQuery]);
			});
		});
	});

	describe('byUser', () => {
		describe('when filtering for a group user', () => {
			it('should build the correct query', () => {
				const userId = new ObjectId().toHexString();

				const result = new GroupAggregateScope().byUser(userId).build();

				expect(result).toEqual([
					{ $match: { users: { $elemMatch: { user: new ObjectId(userId) } } } },
					defaultFacetQuery,
				]);
			});
		});

		describe('when no value was given', () => {
			it('should not include the query in the result', () => {
				const result = new GroupAggregateScope().byUser(undefined).build();

				expect(result).toEqual([defaultFacetQuery]);
			});
		});
	});

	describe('byName', () => {
		describe('when filtering for a group name', () => {
			it('should build the correct query', () => {
				const testName = 'testGroup';

				const result = new GroupAggregateScope().byName(testName).build();

				expect(result).toEqual([{ $match: { name: { $regex: testName, $options: 'i' } } }, defaultFacetQuery]);
			});
		});

		describe('when no value was given', () => {
			it('should not include the query in the result', () => {
				const result = new GroupAggregateScope().byName(undefined).build();

				expect(result).toEqual([defaultFacetQuery]);
			});
		});
	});
});
