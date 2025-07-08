/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FilterQuery } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { SchoolEntity } from '@modules/school/repo';
import { User } from '@modules/user/repo';
import { StringValidator } from '@shared/common/validator';
import { MongoPatterns } from '@shared/repo/mongo.patterns';
import { Scope } from '@shared/repo/scope';
import { ImportUserMatchCreatorScope } from '../domain/interface';
import { ImportUser } from '../entity';

export class ImportUserScope extends Scope<ImportUser> {
	public bySchool(school: SchoolEntity): ImportUserScope {
		if (!ObjectId.isValid(school._id)) throw new Error('invalid school id');

		this.addQuery({ school });

		return this;
	}

	public byUserMatch(user: User): ImportUserScope {
		if (!ObjectId.isValid(user._id)) throw new Error('invalid user match id');

		this.addQuery({ user });

		return this;
	}

	public byFirstName(firstName: string): ImportUserScope {
		const escapedFirstName = firstName.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();

		// TODO make db agnostic
		if (StringValidator.isNotEmptyStringWhenTrimed(escapedFirstName))
			this.addQuery({
				firstName: {
					// @ts-ignore
					$regex: escapedFirstName,
					$options: 'i',
				},
			});

		return this;
	}

	public byLastName(lastName: string): ImportUserScope {
		// TODO filter does not find café when searching with cafe
		const escapedLastName = lastName.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();

		// TODO make db agnostic
		if (StringValidator.isNotEmptyStringWhenTrimed(escapedLastName))
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
	public byLoginName(loginName: string): ImportUserScope {
		// TODO filter does not find café when searching with cafe
		const escapedLoginName = loginName.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();

		// TODO make db agnostic
		if (StringValidator.isNotEmptyStringWhenTrimed(escapedLoginName))
			this.addQuery({
				ldapDn: {
					// @ts-ignore
					$regex: `^uid=[^,]*${escapedLoginName}[^,]*,`,
					$options: 'i',
				},
			});

		return this;
	}

	public byRole(roleName: RoleName): ImportUserScope {
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

	public byClasses(classes: string): ImportUserScope {
		const escapedClasses = classes.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();

		// TODO make db agnostic
		if (StringValidator.isNotEmptyStringWhenTrimed(escapedClasses))
			this.addQuery({
				classNames: {
					// @ts-ignore
					$regex: escapedClasses,
					$options: 'i',
				},
			});

		return this;
	}

	public byMatches(matches: ImportUserMatchCreatorScope[]): ImportUserScope {
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

	public isFlagged(flagged = true): ImportUserScope {
		if (flagged === true) this.addQuery({ flagged: true });

		return this;
	}
}
