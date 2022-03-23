import { MatchCreator, MatchCreatorScope } from '@shared/domain';
import { MatchCreatorResponse, MatchFilterParams } from '../controller/dto';

export class ImportUserMatchMapper {
	static mapImportUserMatchScopeToDomain(match: MatchFilterParams): MatchCreatorScope {
		if (match === MatchFilterParams.AUTO) return MatchCreatorScope.AUTO;
		if (match === MatchFilterParams.MANUAL) return MatchCreatorScope.MANUAL;
		if (match === MatchFilterParams.NONE) return MatchCreatorScope.NONE;
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
