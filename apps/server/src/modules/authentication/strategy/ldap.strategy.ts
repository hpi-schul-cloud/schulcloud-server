import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { System, User } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { AccountDto } from '@src/modules/account/services/dto';
import { Strategy } from 'passport-custom';
import { LdapAuthorizationBodyParams } from '../controllers/dto';
import { ICurrentUser } from '../interface';
import { CurrentUserMapper } from '../mapper';
import { AuthenticationService } from '../services/authentication.service';
import { LdapService } from '../services/ldap.service';

@Injectable()
export class LdapStrategy extends PassportStrategy(Strategy, 'ldap') {
	constructor(
		private readonly systemRepo: SystemRepo,
		private readonly schoolRepo: SchoolRepo,
		private readonly ldapService: LdapService,
		private readonly authenticationService: AuthenticationService,
		private readonly userRepo: UserRepo
	) {
		super();
	}

	async validate(request: { body: LdapAuthorizationBodyParams }): Promise<ICurrentUser> {
		const { username, password, systemId, schoolId } = this.extractParamsFromRequest(request);

		const system: System = await this.systemRepo.findById(systemId);

		const school: SchoolDO = await this.schoolRepo.findById(schoolId);

		if (!school.systems || !school.systems.includes(systemId)) {
			throw new UnauthorizedException(`School ${schoolId} does not have the selected system ${systemId}`);
		}

		const account: AccountDto = await this.loadAccount(username, system.id, school);

		const userId: string = this.checkValue(account.userId);

		this.authenticationService.checkBrutForce(account);

		const user: User = await this.userRepo.findById(userId);

		const ldapDn: string = this.checkValue(user.ldapDn);

		await this.checkCredentials(account, system, ldapDn, password);

		const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(account.id, user, systemId);

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

	private async checkCredentials(account: AccountDto, system: System, ldapDn: string, password: string): Promise<void> {
		try {
			await this.ldapService.checkLdapCredentials(system, ldapDn, password);
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				await this.authenticationService.updateLastTriedFailedLogin(account.id);
			}
			throw error;
		}
	}

	private async loadAccount(username: string, systemId: string, school: SchoolDO): Promise<AccountDto> {
		const externalSchoolId = this.checkValue(school.externalId);

		let account: AccountDto;

		// TODO having to check for two values in order to find an account is not optimal and should be changed.
		// The way the name field of Accounts is used for LDAP should be reconsidered, since
		// mixing the login name with a technical id from a foreign system is not a good pattern.
		// Binding the login name to an identifier from a foreign system or an identifier of a school can lead to
		// accounts not being found when the identifier changes.
		if (school.previousExternalId) {
			try {
				account = await this.authenticationService.loadAccount(
					`${externalSchoolId}/${username}`.toLowerCase(),
					systemId
				);
			} catch (e: unknown) {
				account = await this.authenticationService.loadAccount(
					`${school.previousExternalId}/${username}`.toLowerCase(),
					systemId
				);
			}
		} else {
			account = await this.authenticationService.loadAccount(`${externalSchoolId}/${username}`.toLowerCase(), systemId);
		}

		return account;
	}
}
