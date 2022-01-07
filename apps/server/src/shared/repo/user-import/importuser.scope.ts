/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ImportUser, MatchCreatorScope, School } from '@shared/domain';
import { Scope } from '../scope';

export class ImportUserScope extends Scope<ImportUser> {
	/**
	 * Regex to escape strings before use as regex against database.
	 * Used to remove all non-language characters except numbers, whitespace or minus.
	 */
	private REGEX_WHITELIST = /[^\-\w\d áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ]/gi;

	bySchool(school: School): ImportUserScope {
		this.addQuery({ school: school._id });
		return this;
	}

	byFirstName(firstName: string): ImportUserScope {
		const escapedFirstName = firstName.replace(this.REGEX_WHITELIST, '');
		// TODO make db agnostic
		// @ts-ignore
		if (escapedFirstName.length) this.addQuery({ firstName: { $regex: escapedFirstName, $options: 'i' } });
		return this;
	}

	byLastName(lastName: string): ImportUserScope {
		// TODO filter does not find café when searching with cafe
		const escapedLastName = lastName.replace(this.REGEX_WHITELIST, '');
		// TODO make db agnostic
		// @ts-ignore
		if (escapedLastName.length) this.addQuery({ lastName: { $regex: escapedLastName, $options: 'i' } });
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
