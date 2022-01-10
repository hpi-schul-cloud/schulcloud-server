/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ImportUser, MatchCreatorScope, RoleName, School } from '@shared/domain';
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
		if (escapedFirstName.length)
			this.addQuery({
				firstName: {
					// @ts-ignore
					$regex: escapedFirstName,
					$options: 'i',
				},
			});
		return this;
	}

	byLastName(lastName: string): ImportUserScope {
		// TODO filter does not find café when searching with cafe
		const escapedLastName = lastName.replace(this.REGEX_WHITELIST, '');
		// TODO make db agnostic
		if (escapedLastName.length)
			this.addQuery({
				lastName: {
					// @ts-ignore
					$regex: escapedLastName,
					$options: 'i',
				},
			});
		return this;
	}

	/** filters the login name case insensitive for contains which is part of the dn */
	byLoginName(loginName: string): ImportUserScope {
		// TODO filter does not find café when searching with cafe
		const escapedLoginName = loginName.replace(this.REGEX_WHITELIST, '');
		// TODO make db agnostic
		if (escapedLoginName.length)
			this.addQuery({
				ldapDn: {
					// @ts-ignore
					$regex: `^uid=\\w*${escapedLoginName}\\w*,`,
					$options: 'i',
				},
			});
		return this;
	}

	byRole(roleName: RoleName): ImportUserScope {
		switch (roleName) {
			case RoleName.ADMIN:
				this.addQuery({ roleNames: { $in: ['admin'] } });
				break;
			case RoleName.STUDENT:
				this.addQuery({ roleNames: { $in: ['student'] } });
				break;
			case RoleName.TEACHER:
				this.addQuery({ roleNames: { $in: ['teacher'] } });
				break;
			default:
				throw new Error('unexpected role name');
		}
		return this;
	}

	byClasses(classes: string): ImportUserScope {
		const escapedClasses = classes.replace(this.REGEX_WHITELIST, '');
		// TODO make db agnostic
		if (escapedClasses.length)
			this.addQuery({
				classNames: {
					// @ts-ignore
					$regex: escapedClasses,
					$options: 'i',
				},
			});
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
