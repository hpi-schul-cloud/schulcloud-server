import { MatchCreator, MatchCreatorScope } from '@shared/domain';
import { MatchType, FilterMatchType } from '../controller/dto';

export class ImportUserMatchMapper {
	static mapImportUserMatchScopeToDomain(match: FilterMatchType): MatchCreatorScope {
		if (match === FilterMatchType.AUTO) return MatchCreatorScope.AUTO;
		if (match === FilterMatchType.MANUAL) return MatchCreatorScope.MANUAL;
		if (match === FilterMatchType.NONE) return MatchCreatorScope.NONE;
		throw Error('invalid match from filter query');
	}

	static mapMatchCreatorToResponse(matchCreator: MatchCreator): MatchType {
		switch (matchCreator) {
			case MatchCreator.MANUAL:
				return MatchType.MANUAL;
			case MatchCreator.AUTO:
			default:
				return MatchType.AUTO;
		}
	}
}
