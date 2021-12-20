import { MatchCreatorScope } from '@shared/domain';
import { MatchFilterQuery } from '../controller/dto';

export class ImportUserMatchMapper {
	static mapImportUserMatchScopeToDomain(match: MatchFilterQuery): MatchCreatorScope {
		if (match === MatchFilterQuery.AUTO) return MatchCreatorScope.AUTO;
		if (match === MatchFilterQuery.MANUAL) return MatchCreatorScope.MANUAL;
		if (match === MatchFilterQuery.NONE) return MatchCreatorScope.NONE;
		throw Error(); // ToDo: right error message
	}
}
