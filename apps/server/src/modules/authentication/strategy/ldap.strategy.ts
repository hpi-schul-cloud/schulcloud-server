import { ICurrentUser } from '@infra/auth-guard';
import { Account } from '@modules/account';
import { System, SystemService } from '@modules/system';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { LegacySchoolRepo, UserRepo } from '@shared/repo';
import { ErrorLoggable } from '@src/core/error/loggable/error.loggable';
import { Logger } from '@src/core/logger';
import { Strategy } from 'passport-custom';
import { TypeGuard } from '@shared/common';
import { LdapAuthorizationBodyParams } from '../controllers/dto';
import { StrategyType } from '../interface';
import { CurrentUserMapper } from '../mapper';
import { AuthenticationService } from '../services/authentication.service';
import { LdapService } from '../services/ldap.service';

@Injectable()
export class LdapStrategy extends PassportStrategy(Strategy, StrategyType.LDAP) {
	constructor(
		private readonly systemService: SystemService,
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

		const [system, school] = await Promise.all([
			this.systemService.findByIdOrFail(systemId),
			this.schoolRepo.findById(schoolId),
		]);

		if (!school.systems || !school.systems.includes(systemId)) {
			throw new UnauthorizedException(`School ${schoolId} does not have the selected system ${systemId}`);
		}

		const account = await this.loadAccount(username, system.id, school);
		const userId = TypeGuard.checkNotNullOrUndefined(account.userId, new UnauthorizedException());

		this.authenticationService.checkBrutForce(account);

		// The goal of seperation from account and user is that the user is not needed for the authorization, the following code lines invert this goal.
		const user = await this.userRepo.findById(userId);
		const ldapDn = TypeGuard.checkNotNullOrUndefined(user.ldapDn, new UnauthorizedException());

		await this.checkCredentials(account, system, ldapDn, password);

		const currentUser = CurrentUserMapper.userToICurrentUser(account.id, user, true, systemId);

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

	private async checkCredentials(account: Account, system: System, ldapDn: string, password: string): Promise<void> {
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
		const externalSchoolId = TypeGuard.checkNotNullOrUndefined(school.externalId, new UnauthorizedException());

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
