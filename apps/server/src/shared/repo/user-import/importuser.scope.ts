import { ImportUser, MatchCreatorScope, School } from '@shared/domain';
import { Scope } from '../scope';

export class ImportUserScope extends Scope<ImportUser> {
	bySchool(school: School): ImportUserScope {
		this.addQuery({ school: school._id });
		return this;
	}

	byFirstName(firstName: string): ImportUserScope {
		// TODO add support to ignore special chars
		// @ts-ignore
		this.addQuery({ firstName: { $regex: firstName, $options: 'i' } });
		return this;
	}

	byLastName(lastName: string): ImportUserScope {
		// @ts-ignore
		this.addQuery({ lastName: { $regex: lastName, $options: 'i' } });
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

	isFlagged(flagged = true) {
		this.addQuery({ flagged });
		return this;
	}
}
