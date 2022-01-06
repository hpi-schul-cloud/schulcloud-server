import { ImportUser, MatchCreatorScope, School } from '@shared/domain';
import { Scope } from '../scope';

export class ImportUserScope extends Scope<ImportUser> {
	byFirstName(firstName: string): ImportUserScope {
		this.addQuery({ firstName });
		return this;
	}

	byLastName(lastName: string): ImportUserScope {
		this.addQuery({ lastName });
		return this;
	}

	bySchool(school: School): ImportUserScope {
		this.addQuery({ school: school._id });
		return this;
	}

	byMatches(matches: MatchCreatorScope[]) {
		const queries = matches
			.map((match) => {
				if (match === MatchCreatorScope.MANUAL) return { match_matchedBy: 'admin' };
				if (match === MatchCreatorScope.AUTO) return { match_matchedBy: 'auto' };
				if (match === MatchCreatorScope.NONE) return { match_matchedBy: { $exists: false } };
				return null;
			})
			.filter((match) => match != null);
		this.addQuery({ $or: queries });
		return this;
	}
}
