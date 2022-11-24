/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ICurrentUser, School, System } from '@shared/domain';
import { CurrentUserMapper } from '@shared/domain/mapper/current-user.mapper';
import { SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
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

	async validate(request: Request): Promise<ICurrentUser> {
		const {
			systemId,
			username,
			password,
			schoolId,
		}: { systemId: string; username: string; password: string; schoolId: string } = request.body;
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
		const user = await this.userRepo.findById(account.userId);
		if (!user.ldapDn) {
			throw new UnauthorizedException();
		}
		await this.ldapService.authenticate(system, user.ldapDn, password);
		return CurrentUserMapper.userToICurrentUser(account.id, user, systemId);
	}
}
