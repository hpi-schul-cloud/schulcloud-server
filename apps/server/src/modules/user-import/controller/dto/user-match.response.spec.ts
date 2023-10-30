import { MatchType } from './match-type';
import { UserMatchListResponse, UserMatchResponse } from './user-match.response';
import { UserRole } from './user-role';

describe('[UserMatchReponse]', () => {
	const constructorProps: UserMatchResponse = {
		userId: 'users_id',
		loginName: 'login_name',
		firstName: 'first_name',
		lastName: 'last_name',
		roleNames: [UserRole.ADMIN],
	};
	it('should initialize with required properties', () => {
		const result = new UserMatchResponse(constructorProps);
		expect(result).toEqual(constructorProps);
	});
	it('should init with required and optional properties', () => {
		const result = new UserMatchResponse({ ...constructorProps, matchedBy: MatchType.AUTO });
		expect(result).toEqual({ ...constructorProps, matchedBy: MatchType.AUTO });
	});
	describe('[UserMatchListResponse]', () => {
		it('should initialize list response', () => {
			const item = new UserMatchResponse(constructorProps);
			const result = new UserMatchListResponse([item], 1, 2, 3);
			expect(result).toEqual({ total: 1, skip: 2, limit: 3, data: [item] });
		});
	});
});
