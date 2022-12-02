/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ICurrentUser, School, System } from '@shared/domain';
import { CurrentUserMapper } from '@shared/domain/mapper/current-user.mapper';
import { SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { Strategy } from 'passport-custom';
import { AuthenticationService } from '../services/authentication.service';
import { LdapService } from '../services/ldap.service';

export type RequestBody = { systemId?: string; username?: string; password?: string; schoolId?: string };

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

	async validate(request: { body: RequestBody }): Promise<ICurrentUser> {
		const { systemId, username, password, schoolId } = request.body;
		if (!systemId || !username || !password || !schoolId) {
			throw new UnauthorizedException();
		}
		const system: System = await this.systemRepo.findById(systemId);
		const school: School = await this.schoolRepo.findById(schoolId);
		if (!school.externalId) {
			throw new UnauthorizedException();
		}
		const userNameWithSchool = `${school.externalId}/${username}`;
		const account = await this.authenticationService.loadAccount(userNameWithSchool, systemId);
		if (!account.userId) {
			throw new UnauthorizedException();
		}
		this.authenticationService.checkBrutForce(account);
		const user = await this.userRepo.findById(account.userId);
		if (!user.ldapDn) {
			throw new UnauthorizedException();
		}
		try {
			await this.ldapService.authenticate(system, user.ldapDn, password);
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				await this.authenticationService.updateLastTriedFailedLogin(account.id);
				throw error;
			}
		}
		return CurrentUserMapper.userToICurrentUser(account.id, user, systemId);
	}
}
