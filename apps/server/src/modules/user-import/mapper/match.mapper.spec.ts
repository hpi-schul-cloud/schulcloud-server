import { MatchCreator, MatchCreatorScope } from '@shared/domain';
import { setupEntities, userFactory } from '@shared/testing';
import { MatchCreatorResponse, MatchFilterQuery, UserMatchResponse } from '../controller/dto';
import { ImportUserMatchMapper } from './match.mapper';

describe('[ImportUserMatchMapper', () => {
	describe('[mapImportUserMatchScopeToDomain] from query', () => {
		it('should map auto from query to domain', () => {
			const match = MatchFilterQuery.AUTO;
			const result = ImportUserMatchMapper.mapImportUserMatchScopeToDomain(match);
			expect(result).toEqual(MatchCreatorScope.AUTO);
		});
		it('should map manual/admin from query to domain', () => {
			const match = MatchFilterQuery.MANUAL;
			const result = ImportUserMatchMapper.mapImportUserMatchScopeToDomain(match);
			expect(result).toEqual(MatchCreatorScope.MANUAL);
		});
		it('should map no match from query to domain', () => {
			const match = MatchFilterQuery.NONE;
			const result = ImportUserMatchMapper.mapImportUserMatchScopeToDomain(match);
			expect(result).toEqual(MatchCreatorScope.NONE);
		});
		it('should fail for other values', () => {
			const match = 'foo' as unknown as MatchFilterQuery;
			expect(() => ImportUserMatchMapper.mapImportUserMatchScopeToDomain(match)).toThrowError(
				'invalid match from filter query'
			);
		});
	});
	describe('[mapMatchCreatorToResponse] from domain', () => {
		it('should map auto to response', () => {
			const matchCreator = MatchCreator.AUTO;
			const result = ImportUserMatchMapper.mapMatchCreatorToResponse(matchCreator);
			expect(result).toEqual(MatchCreatorResponse.AUTO);
		});
		it('should map manual to response', () => {
			const matchCreator = MatchCreator.MANUAL;
			const result = ImportUserMatchMapper.mapMatchCreatorToResponse(matchCreator);
			expect(result).toEqual(MatchCreatorResponse.MANUAL);
		});
		it('should map manual to response for all other input', () => {
			const matchCreator = 'foo' as unknown as MatchCreator;
			const result = ImportUserMatchMapper.mapMatchCreatorToResponse(matchCreator);
			expect(result).toEqual(MatchCreatorResponse.MANUAL);
		});
	});
	describe('[mapToResponse] from domain', () => {
		beforeAll(async () => {
			await setupEntities();
		});
		it('should map user match to response ', () => {
			const user = userFactory.buildWithId();
			const matchCreator = MatchCreator.AUTO;
			const matchedBySpy = jest
				.spyOn(ImportUserMatchMapper, 'mapMatchCreatorToResponse')
				.mockReturnValue(MatchCreatorResponse.AUTO);
			const result = ImportUserMatchMapper.mapToResponse(user, matchCreator);
			const matchedBy = MatchCreatorResponse.AUTO;
			const expectedResult = new UserMatchResponse({
				userId: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				loginName: user.email,
				matchedBy,
			});
			expect(result).toEqual(expectedResult);
			expect(matchedBySpy).toBeCalledWith(matchCreator);
		});
	});
});
