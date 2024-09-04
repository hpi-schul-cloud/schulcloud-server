/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FilterQuery } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { StringValidator } from '@shared/common';
import { SchoolEntity, User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { MongoPatterns } from '@shared/repo';
import { Scope } from '@shared/repo/scope';
import { ImportUserMatchCreatorScope } from '../domain/interface';
import { ImportUser } from '../entity';

export class ImportUserScope extends Scope<ImportUser> {
	bySchool(school: SchoolEntity): ImportUserScope {
		const schoolId = school._id;
		if (!ObjectId.isValid(schoolId)) throw new Error('invalid school id');
		this.addQuery({ school });
		return this;
	}

	byUserMatch(user: User): ImportUserScope {
		const userId = user._id;
		if (!ObjectId.isValid(userId)) throw new Error('invalid user match id');
		this.addQuery({ user });
		return this;
	}

	byFirstName(firstName: string): ImportUserScope {
		const escapedFirstName = firstName.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
		// TODO make db agnostic
		if (StringValidator.isNotEmptyString(escapedFirstName, true))
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
		const escapedLastName = lastName.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
		// TODO make db agnostic
		if (StringValidator.isNotEmptyString(escapedLastName, true))
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
		const escapedLoginName = loginName.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
		// TODO make db agnostic
		if (StringValidator.isNotEmptyString(escapedLoginName, true))
			this.addQuery({
				ldapDn: {
					// @ts-ignore
					$regex: `^uid=[^,]*${escapedLoginName}[^,]*,`,
					$options: 'i',
				},
			});
		return this;
	}

	byRole(roleName: RoleName): ImportUserScope {
		switch (roleName) {
			case RoleName.ADMINISTRATOR:
				this.addQuery({ roleNames: { $in: [RoleName.ADMINISTRATOR] } });
				break;
			case RoleName.STUDENT:
				this.addQuery({ roleNames: { $in: [RoleName.STUDENT] } });
				break;
			case RoleName.TEACHER:
				this.addQuery({ roleNames: { $in: [RoleName.TEACHER] } });
				break;
			default:
				throw new Error('unexpected role name');
		}
		return this;
	}

	byClasses(classes: string): ImportUserScope {
		const escapedClasses = classes.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
		// TODO make db agnostic
		if (StringValidator.isNotEmptyString(escapedClasses, true))
			this.addQuery({
				classNames: {
					// @ts-ignore
					$regex: escapedClasses,
					$options: 'i',
				},
			});
		return this;
	}

	byMatches(matches: ImportUserMatchCreatorScope[]) {
		const queries = matches
			.map((match) => {
				if (match === ImportUserMatchCreatorScope.MANUAL) return { matchedBy: 'admin' };
				if (match === ImportUserMatchCreatorScope.AUTO) return { matchedBy: 'auto' };
				if (match === ImportUserMatchCreatorScope.NONE) return { matchedBy: null };
				return null;
			})
			.filter((match) => match != null);
		if (queries.length > 0) this.addQuery({ $or: queries as FilterQuery<ImportUser>[] });
		return this;
	}

	isFlagged(flagged = true) {
		if (flagged === true) this.addQuery({ flagged: true });
		return this;
	}
}
