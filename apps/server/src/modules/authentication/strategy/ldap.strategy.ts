import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { Strategy } from 'passport-custom';
import { AccountDto } from '@src/modules/account/services/dto';
import { GuardAgainst } from '@shared/common/utils/guard-against';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { IdentityManagementOauthService } from '@shared/infra/identity-management';
import { AuthenticationService } from '../services/authentication.service';
import { ICurrentUser } from '../interface/user';
import { CurrentUserMapper } from '../mapper';

export type RequestBody = { systemId?: string; username?: string; password?: string; schoolId?: string };

@Injectable()
export class LdapStrategy extends PassportStrategy(Strategy, 'ldap') {
	constructor(
		private readonly systemRepo: SystemRepo,
		private readonly schoolRepo: SchoolRepo,
		private readonly authenticationService: AuthenticationService,
		private readonly idmOauthService: IdentityManagementOauthService,
		private readonly userRepo: UserRepo
	) {
		super();
	}

	async validate(request: { body: RequestBody }): Promise<ICurrentUser> {
		const { username, password, systemId, schoolId } = this.extractParamsFromRequest(request);
		const school = await this.schoolRepo.findById(schoolId);
		const account = await this.loadAccount(username, systemId, school);
		const userId = this.checkValue(account.userId);
		this.authenticationService.checkBrutForce(account);
		const user = await this.userRepo.findById(userId);
		await this.checkCredentials(username, password);
		const currentUser = CurrentUserMapper.userToICurrentUser(account.id, user, systemId);
		return currentUser;
	}

	private extractParamsFromRequest(request: { body: RequestBody }): Required<RequestBody> {
		const { systemId, schoolId } = request.body;
		let { username, password } = request.body;
		if (!systemId || !username || !password || !schoolId) {
			throw new UnauthorizedException();
		}
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

	private async checkCredentials(username: string, password: string): Promise<void> {
		const jwt = await this.idmOauthService.resourceOwnerPasswordGrant(username, password);
		GuardAgainst.nullOrUndefined(jwt, new UnauthorizedException());
	}

	private async loadAccount(username: string, systemId: string, school: SchoolDO): Promise<AccountDto> {
		const externalSchoolId = this.checkValue(school.externalId);
		const userNameWithSchool = `${externalSchoolId}/${username}`;
		const account = await this.authenticationService.loadAccount(userNameWithSchool.toLowerCase(), systemId);
		return account;
	}
}
