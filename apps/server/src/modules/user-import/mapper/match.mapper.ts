import { MatchCreator, MatchCreatorScope } from '@shared/domain';
import { MatchCreatorResponse, MatchFilterQuery } from '../controller/dto';

export class ImportUserMatchMapper {
	static mapImportUserMatchScopeToDomain(match: MatchFilterQuery): MatchCreatorScope {
		if (match === MatchFilterQuery.AUTO) return MatchCreatorScope.AUTO;
		if (match === MatchFilterQuery.MANUAL) return MatchCreatorScope.MANUAL;
		if (match === MatchFilterQuery.NONE) return MatchCreatorScope.NONE;
		throw Error('invalid match from filter query');
	}

	static mapMatchCreatorToResponse(matchCreator: MatchCreator): MatchCreatorResponse {
		switch (matchCreator) {
			case MatchCreator.MANUAL:
				return MatchCreatorResponse.MANUAL;
			case MatchCreator.AUTO:
			default:
				return MatchCreatorResponse.AUTO;
		}
	}
}
