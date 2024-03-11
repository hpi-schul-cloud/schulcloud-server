import { ObjectId } from 'bson';
import { UserSearchQuery } from '../../interfaces';
import { SearchQueryHelper } from '.';
import { UsersSearchQueryParams } from '../../controller/dto';

describe('Search query helper', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('when searching by searchQuery', () => {
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

		it('should fill searchQuery and searchFilterGate', () => {
			const { queryParams, query } = setup();

			SearchQueryHelper.setSearchParametersIfExist(query, queryParams);

			expect(query.searchQuery).toEqual('test t te tes est');
			expect(query.searchFilterGate).toEqual(9);
			expect(query.sort).toEqual({ firstName: 1, sortBySearchQueryResult: 1 });
		});
	});
});
