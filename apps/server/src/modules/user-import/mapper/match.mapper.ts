import { MatchCreator, MatchCreatorScope, User } from '@shared/domain';
import { MatchCreatorResponse, MatchFilterQuery, UserMatchResponse } from '../controller/dto';

export class ImportUserMatchMapper {
	static mapImportUserMatchScopeToDomain(match: MatchFilterQuery): MatchCreatorScope {
		if (match === MatchFilterQuery.AUTO) return MatchCreatorScope.AUTO;
		if (match === MatchFilterQuery.MANUAL) return MatchCreatorScope.MANUAL;
		if (match === MatchFilterQuery.NONE) return MatchCreatorScope.NONE;
		throw Error('invalid match from filter query');
	}

	static mapToResponse(user: User, matchCreator: MatchCreator): UserMatchResponse {
		const matchedBy = this.mapMatchCreatorToResponse(matchCreator);
		const dto = new UserMatchResponse({
			userId: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			loginName: user.email,
			matchedBy,
		});

		return dto;
	}

	static mapMatchCreatorToResponse(matchCreator: MatchCreator): MatchCreatorResponse {
		switch (matchCreator) {
			case MatchCreator.AUTO:
				return MatchCreatorResponse.AUTO;
			case MatchCreator.MANUAL:
			default:
				return MatchCreatorResponse.MANUAL;
		}
	}
}
