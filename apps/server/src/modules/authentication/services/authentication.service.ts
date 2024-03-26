import { AccountService } from '@modules/account';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// invalid import
import { AccountDto } from '@modules/account/services/dto';
// invalid import, can produce dependency cycles
import type { ServerConfig } from '@modules/server';
import { randomUUID } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { System, SystemService } from '@modules/system';
import { UserDO } from '@shared/domain/domainobject';
import { UserService } from '@modules/user';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios';
import { BruteForceError, UnauthorizedLoggableException } from '../errors';
import { CreateJwtPayload } from '../interface/jwt-payload';
import { JwtValidationAdapter } from '../strategy/jwt-validation.adapter';
import { LoginDto } from '../uc/dto';

interface KeycloakLogoutDto {
	client_id?: string;
	client_secret?: string;
	refresh_token?: string;
}

@Injectable()
export class AuthenticationService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly jwtValidationAdapter: JwtValidationAdapter,
		private readonly accountService: AccountService,
		private readonly configService: ConfigService<ServerConfig, true>,
		private readonly userService: UserService,
		private readonly systemService: SystemService,
		private readonly httpService: HttpService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: EncryptionService
	) {}

	async loadAccount(username: string, systemId?: string): Promise<AccountDto> {
		let account: AccountDto | undefined | null;

		if (systemId) {
			account = await this.accountService.findByUsernameAndSystemId(username, systemId);
		} else {
			const [accounts] = await this.accountService.searchByUsernameExactMatch(username);
			account = accounts.find((foundAccount) => foundAccount.systemId == null);
		}

		if (!account) {
			throw new UnauthorizedLoggableException(username, systemId);
		}

		return account;
	}

	async generateJwt(user: CreateJwtPayload): Promise<LoginDto> {
		const jti = randomUUID();

		const result: LoginDto = new LoginDto({
			accessToken: this.jwtService.sign(user, {
				subject: user.accountId,
				jwtid: jti,
			}),
		});

		await this.jwtValidationAdapter.addToWhitelist(user.accountId, jti);

		return result;
	}

	async removeJwtFromWhitelist(jwtToken: string): Promise<void> {
		const decodedJwt: JwtPayload | null = jwt.decode(jwtToken, { json: true });

		if (decodedJwt && decodedJwt.jti && decodedJwt.accountId && typeof decodedJwt.accountId === 'string') {
			await this.jwtValidationAdapter.removeFromWhitelist(decodedJwt.accountId, decodedJwt.jti);
		}
	}

	async logoutFromKeycloak(userId: string, systemId: string): Promise<void> {
		const user: UserDO = await this.userService.findById(userId);
		const system: System | null = await this.systemService.findById(systemId);

		const dto: KeycloakLogoutDto = {
			refresh_token: user.sessionToken,
		};

		const headers: AxiosHeaders = new AxiosHeaders();
		headers.setContentType('application/x-www-form-urlencoded');

		const config: AxiosRequestConfig = {
			auth: {
				username: system?.oauthConfig?.clientId as string,
				password: this.oAuthEncryptionService.decrypt(system?.oauthConfig?.clientSecret as string),
			},
			headers,
		};

		const resp: AxiosResponse = await firstValueFrom(
			this.httpService.post(
				'https://auth.stage.niedersachsen-login.schule/realms/SANIS/protocol/openid-connect/logout',
				dto,
				config
			)
		);
		console.log(resp.headers);
	}

	checkBrutForce(account: AccountDto): void {
		if (account.lasttriedFailedLogin) {
			const timeDifference = (new Date().getTime() - account.lasttriedFailedLogin.getTime()) / 1000;

			if (timeDifference < this.configService.get<number>('LOGIN_BLOCK_TIME')) {
				const timeToWait = this.configService.get<number>('LOGIN_BLOCK_TIME') - Math.ceil(timeDifference);
				throw new BruteForceError(timeToWait, `Brute Force Prevention! Time to wait: ${timeToWait} s`);
			}
		}
	}

	async updateLastTriedFailedLogin(id: string): Promise<void> {
		await this.accountService.updateLastTriedFailedLogin(id, new Date());
	}

	normalizeUsername(username: string): string {
		return username.trim().toLowerCase();
	}

	normalizePassword(password: string): string {
		return password.trim();
	}
}
