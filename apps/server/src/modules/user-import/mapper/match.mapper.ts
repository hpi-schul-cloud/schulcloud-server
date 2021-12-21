import { MatchCreator, MatchCreatorScope, UserMatch } from '@shared/domain';
import { MatchCreatorResponse, MatchFilterQuery, UserMatchResponse } from '../controller/dto';

export class ImportUserMatchMapper {
	static mapImportUserMatchScopeToDomain(match: MatchFilterQuery): MatchCreatorScope {
		if (match === MatchFilterQuery.AUTO) return MatchCreatorScope.AUTO;
		if (match === MatchFilterQuery.MANUAL) return MatchCreatorScope.MANUAL;
		if (match === MatchFilterQuery.NONE) return MatchCreatorScope.NONE;
		throw Error(); // ToDo: right error message
	}

	static mapToResponse(match: UserMatch): UserMatchResponse {
		const dto = new UserMatchResponse({
			userId: match.user._id.toString(),
			firstName: match.user.firstName,
			lastName: match.user.lastName,
			loginName: match.user.email,
			matchedBy: this.mapMatchCreatorToResponse(match.matchedBy),
		});
		return dto;
	}

	static mapMatchCreatorToResponse(matchCreator: MatchCreator): MatchCreatorResponse | undefined {
		if (matchCreator === MatchCreator.AUTO) return MatchCreatorResponse.AUTO;
		if (matchCreator === MatchCreator.MANUAL) return MatchCreatorResponse.MANUAL;
		return undefined;
	}
}
