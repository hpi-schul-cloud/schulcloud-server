import { ObjectId } from 'mongodb';
import { ImportUser, MatchCreatorScope } from '@shared/domain';
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

	bySchoolId(schoolId: string): ImportUserScope {
		// @ts-ignore
		this.addQuery({ schoolId: new ObjectId(schoolId) });
		return this;
	}

	byMatches(matches: MatchCreatorScope[]) {
		const queries = matches.map((match) => {
			if (match === MatchCreatorScope.MANUAL) return { 'match.matchedBy': 'admin' };
			if (match === MatchCreatorScope.AUTO) return { 'match.matchedBy': 'auto' };
			if (match === MatchCreatorScope.NONE) return { 'match.matchedBy': { $exists: false } };
			throw Error(); // ToDo: right error message
		});
		this.addQuery({ $or: queries });
		return this;
	}
}
