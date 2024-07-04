import { Account } from '@modules/account';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { SystemEntity, User } from '@shared/domain/entity';
import { LegacySchoolRepo, LegacySystemRepo, UserRepo } from '@shared/repo';
import { ErrorLoggable } from '@src/core/error/loggable/error.loggable';
import { Logger } from '@src/core/logger';
import { Strategy } from 'passport-custom';
import { LdapAuthorizationBodyParams } from '../controllers/dto';
import { ICurrentUser } from '../interface';
import { CurrentUserMapper } from '../mapper';
import { AuthenticationService } from '../services/authentication.service';
import { LdapService } from '../services/ldap.service';

@Injectable()
export class LdapStrategy extends PassportStrategy(Strategy, 'ldap') {
	constructor(
		private readonly systemRepo: LegacySystemRepo,
		private readonly schoolRepo: LegacySchoolRepo,
		private readonly ldapService: LdapService,
		private readonly authenticationService: AuthenticationService,
		private readonly userRepo: UserRepo,
		private readonly logger: Logger
	) {
		super();
	}

	async validate(request: { body: LdapAuthorizationBodyParams }): Promise<ICurrentUser> {
		const { username, password, systemId, schoolId } = this.extractParamsFromRequest(request);

		const system: SystemEntity = await this.systemRepo.findById(systemId);
		const school: LegacySchoolDo = await this.schoolRepo.findById(schoolId);

		if (!school.systems || !school.systems.includes(systemId)) {
			throw new UnauthorizedException(`School ${schoolId} does not have the selected system ${systemId}`);
		}

		const account: Account = await this.loadAccount(username, system.id, school);
		const userId: string = this.checkValue(account.userId);

		this.authenticationService.checkBrutForce(account);

		const user: User = await this.userRepo.findById(userId);
		const ldapDn: string = this.checkValue(user.ldapDn);

		await this.checkCredentials(account, system, ldapDn, password);

		const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(account.id, user, true, systemId);

		return currentUser;
	}

	private extractParamsFromRequest(request: {
		body: LdapAuthorizationBodyParams;
	}): Required<LdapAuthorizationBodyParams> {
		const { systemId, schoolId } = request.body;
		let { username, password } = request.body;

		username = this.authenticationService.normalizeUsername(username);
		password = this.authenticationService.normalizePassword(password);

		return { username, password, systemId, schoolId };
	}

	private checkValue<T>(value: T | null | undefined): T | never {
		if (value === null || value === undefined) {
			throw new UnauthorizedException();
		}
		return value;
	}

	private async checkCredentials(
		account: Account,
		system: SystemEntity,
		ldapDn: string,
		password: string
	): Promise<void> {
		try {
			await this.ldapService.checkLdapCredentials(system, ldapDn, password);
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				await this.authenticationService.updateLastTriedFailedLogin(account.id);
			}
			throw error;
		}
	}

	private async loadAccount(username: string, systemId: string, school: LegacySchoolDo): Promise<Account> {
		const externalSchoolId = this.checkValue(school.externalId);

		let account: Account;

		// TODO having to check for two values in order to find an account is not optimal and should be changed.
		// The way the name field of Accounts is used for LDAP should be reconsidered, since
		// mixing the login name with a technical id from a foreign system is not a good pattern.
		// Binding the login name to an identifier from a foreign system or an identifier of a school can lead to
		// accounts not being found when the identifier changes.
		try {
			account = await this.authenticationService.loadAccount(`${externalSchoolId}/${username}`.toLowerCase(), systemId);
		} catch (err: unknown) {
			if (school.previousExternalId) {
				this.logger.info(
					new ErrorLoggable(
						new Error(
							`Could not find LDAP account with externalSchoolId ${externalSchoolId} for user ${username}. Trying to use the previousExternalId ${school.previousExternalId} next...`
						)
					)
				);

				account = await this.authenticationService.loadAccount(
					`${school.previousExternalId}/${username}`.toLowerCase(),
					systemId
				);
			} else {
				throw err;
			}
		}

		return account;
	}
}
