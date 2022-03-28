import { MatchCreator, MatchCreatorScope } from '@shared/domain';
import { MatchType, FilterMatchType } from '../controller/dto';
import { ImportUserMatchMapper } from './match.mapper';

describe('[ImportUserMatchMapper]', () => {
	describe('[mapImportUserMatchScopeToDomain] from query', () => {
		it('should map auto from query to domain', () => {
			const match = FilterMatchType.AUTO;
			const result = ImportUserMatchMapper.mapImportUserMatchScopeToDomain(match);
			expect(result).toEqual(MatchCreatorScope.AUTO);
		});
		it('should map manual/admin from query to domain', () => {
			const match = FilterMatchType.MANUAL;
			const result = ImportUserMatchMapper.mapImportUserMatchScopeToDomain(match);
			expect(result).toEqual(MatchCreatorScope.MANUAL);
		});
		it('should map no match from query to domain', () => {
			const match = FilterMatchType.NONE;
			const result = ImportUserMatchMapper.mapImportUserMatchScopeToDomain(match);
			expect(result).toEqual(MatchCreatorScope.NONE);
		});
		it('should fail for other values', () => {
			const match = 'foo' as unknown as FilterMatchType;
			expect(() => ImportUserMatchMapper.mapImportUserMatchScopeToDomain(match)).toThrowError(
				'invalid match from filter query'
			);
		});
	});
	describe('[mapMatchCreatorToResponse] from domain', () => {
		it('should map auto to response', () => {
			const matchCreator = MatchCreator.AUTO;
			const result = ImportUserMatchMapper.mapMatchCreatorToResponse(matchCreator);
			expect(result).toEqual(MatchType.AUTO);
		});
		it('should map manual to response', () => {
			const matchCreator = MatchCreator.MANUAL;
			const result = ImportUserMatchMapper.mapMatchCreatorToResponse(matchCreator);
			expect(result).toEqual(MatchType.MANUAL);
		});
		it('should map auto to response for all other input', () => {
			const matchCreator = 'foo' as unknown as MatchCreator;
			const result = ImportUserMatchMapper.mapMatchCreatorToResponse(matchCreator);
			expect(result).toEqual(MatchType.AUTO);
		});
	});
});
