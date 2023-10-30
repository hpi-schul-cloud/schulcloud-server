import { MatchCreator } from '@shared/domain/entity/import-user.entity';
import { MatchCreatorScope } from '@shared/domain/types/importuser.types';
import { FilterMatchType } from '../controller/dto/filter-import-user.params';
import { MatchType } from '../controller/dto/match-type';

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
