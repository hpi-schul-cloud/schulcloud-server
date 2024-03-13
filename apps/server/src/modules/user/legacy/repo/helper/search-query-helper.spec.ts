import { ObjectId } from 'bson';
import { UserSearchQuery } from '../../interfaces';
import { SearchQueryHelper } from '.';
import {RangeType, UsersSearchQueryParams} from '../../controller/dto';

describe('Search query helper', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('when search parameters exists', () => {
		const setup = () => {
			const exampleId = '5fa31aacb229544f2c697b48';

			const queryParams: UsersSearchQueryParams = {
				$skip: 0,
				$limit: 5,
				$sort: { firstName: 1 },
				searchQuery: 'test',
			};

			const query: UserSearchQuery = {
				skip: 0,
				limit: 5,
				sort: { firstName: 1 },
				schoolId: new ObjectId(exampleId),
				schoolYearId: new ObjectId(exampleId),
				roles: new ObjectId(exampleId),
				select: [
					'consentStatus',
					'consent',
					'classes',
					'firstName',
					'lastName',
					'email',
					'createdAt',
					'importHash',
					'birthday',
					'preferences.registrationMailSend',
					'lastLoginSystemChange',
					'outdatedSince',
				],
			};

			return {
				queryParams,
				query,
			};
		};

		it('setSearchParametersIfExist should fill searchQuery and searchFilterGate', () => {
			const { queryParams, query } = setup();

			SearchQueryHelper.setSearchParametersIfExist(query, queryParams);

			expect(query.searchQuery).toEqual('test t te tes est');
			expect(query.searchFilterGate).toEqual(9);
			expect(query.sort).toEqual({ firstName: 1, sortBySearchQueryResult: 1 });
		});
	});

	describe('when date parameters exists', () => {
		const setup = () => {
			const exampleId = '5fa31aacb229544f2c697b48';

			const dateParam: Record<RangeType, Date> = {
				$gt: new Date('2024-02-08T23:00:00Z'),
				$gte: new Date('2024-02-08T23:00:00Z'),
				$lt: new Date('2024-02-08T23:00:00Z'),
				$lte: new Date('2024-02-08T23:00:00Z'),
			};

			const queryParams: UsersSearchQueryParams = {
				$skip: 0,
				$limit: 5,
				$sort: { firstName: 1 },
				createdAt: dateParam,
				lastLoginSystemChange: dateParam,
				outdatedSince: dateParam,
			};

			const query: UserSearchQuery = {
				skip: 0,
				limit: 5,
				sort: { firstName: 1 },
				schoolId: new ObjectId(exampleId),
				schoolYearId: new ObjectId(exampleId),
				roles: new ObjectId(exampleId),
				select: [
					'consentStatus',
					'consent',
					'classes',
					'firstName',
					'lastName',
					'email',
					'createdAt',
					'importHash',
					'birthday',
					'preferences.registrationMailSend',
					'lastLoginSystemChange',
					'outdatedSince',
				],
			};

			return {
				queryParams,
				query,
				dateParam,
			};
		};

		it('setDateParametersIfExists should fill date params', () => {
			const { queryParams, query, dateParam } = setup();

			SearchQueryHelper.setDateParametersIfExists(query, queryParams);

			expect(query.createdAt).toEqual(dateParam);
			expect(query.lastLoginSystemChange).toEqual(dateParam);
			expect(query.outdatedSince).toEqual(dateParam);
		});
	});
});
