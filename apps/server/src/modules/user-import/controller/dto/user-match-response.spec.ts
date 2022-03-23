import { MatchCreatorResponse, RoleNameResponse, UserMatchListResponse, UserMatchResponse } from '.';

describe('[UserMatchReponse]', () => {
	const constructorProps: UserMatchResponse = {
		userId: 'users_id',
		loginName: 'login_name',
		firstName: 'first_name',
		lastName: 'last_name',
		roleNames: [RoleNameResponse.ADMIN],
	};
	it('should initialize with required properties', () => {
		const result = new UserMatchResponse(constructorProps);
		expect(result).toEqual(constructorProps);
	});
	it('should init with required and optional properties', () => {
		const result = new UserMatchResponse({ ...constructorProps, matchedBy: MatchCreatorResponse.AUTO });
		expect(result).toEqual({ ...constructorProps, matchedBy: MatchCreatorResponse.AUTO });
	});
	describe('[UserMatchListResponse]', () => {
		it('should initialize list response', () => {
			const item = new UserMatchResponse(constructorProps);
			const result = new UserMatchListResponse([item], 1, 2, 3);
			expect(result).toEqual({ total: 1, skip: 2, limit: 3, data: [item] });
		});
	});
});
