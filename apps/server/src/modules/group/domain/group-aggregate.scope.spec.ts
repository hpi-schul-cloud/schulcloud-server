import { ObjectId } from '@mikro-orm/mongodb';
import { GroupAggregateScope } from './group-aggregate.scope';
import { GroupTypes } from './group-types';

describe(GroupAggregateScope.name, () => {
	const defaultFacetQuery = {
		$facet: {
			data: [{ $skip: 0 }],
			total: [{ $count: 'count' }],
		},
	};

	describe('byAvailableForSync', () => {
		describe('when filtering for groups that are available for a course synchronization', () => {
			it('should build the correct query', () => {
				const result = new GroupAggregateScope().byAvailableForSync(true).build();

				expect(result).toEqual([
					{ $match: { type: { $in: [GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER] } } },
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

	describe('byType', () => {
		describe('when filtering for a group type', () => {
			it('should build the correct query', () => {
				const testType = GroupTypes.CLASS;

				const result = new GroupAggregateScope().byType([testType]).build();

				expect(result).toEqual([{ $match: { type: { $in: [testType] } } }, defaultFacetQuery]);
			});
		});

		describe('when no value was given', () => {
			it('should not include the query in the result', () => {
				const result = new GroupAggregateScope().byType(undefined).build();

				expect(result).toEqual([defaultFacetQuery]);
			});
		});
	});

	describe('byUsersSchoolId', () => {
		describe('when filtering for a group by users school id', () => {
			it('should build the correct query', () => {
				const schoolId = new ObjectId().toHexString();

				const result = new GroupAggregateScope().byUsersSchoolId(schoolId).build();

				expect(result).not.toEqual([defaultFacetQuery]);
			});
		});

		describe('when no value was given', () => {
			it('should not include the query in the result', () => {
				const result = new GroupAggregateScope().byUsersSchoolId(undefined).build();

				expect(result).toEqual([defaultFacetQuery]);
			});
		});
	});
});
