import { FilterMatchType, MatchType } from '../controller/dto';
import { ImportUserMatchCreatorScope } from '../domain/interface';
import { MatchCreator } from '../entity';

export class ImportUserMatchMapper {
	public static mapImportUserMatchScopeToDomain(match: FilterMatchType): ImportUserMatchCreatorScope {
		if (match === FilterMatchType.AUTO) return ImportUserMatchCreatorScope.AUTO;
		if (match === FilterMatchType.MANUAL) return ImportUserMatchCreatorScope.MANUAL;
		if (match === FilterMatchType.NONE) return ImportUserMatchCreatorScope.NONE;
		throw Error('invalid match from filter query');
	}

	public static mapMatchCreatorToResponse(matchCreator: MatchCreator): MatchType {
		switch (matchCreator) {
			case MatchCreator.MANUAL:
				return MatchType.MANUAL;
			case MatchCreator.AUTO:
			default:
				return MatchType.AUTO;
		}
	}
}
