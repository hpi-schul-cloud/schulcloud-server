import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { UserRepo } from '@shared/repo';
import { ICurrentUser } from '@shared/domain';
import { CurrentUserMapper } from '@shared/domain/mapper/current-user.mapper';
import { HttpService } from '@nestjs/axios';
import { IKeycloakSettings, KeycloakSettings } from '@shared/infra/identity-management/keycloak/interface';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly authenticationService: AuthenticationService,
		private readonly userRepo: UserRepo,
		private readonly httpService: HttpService,
		@Inject(KeycloakSettings) private readonly kcSettings: IKeycloakSettings
	) {
		super();
	}

	async validate(username?: string, password?: string): Promise<ICurrentUser> {
		({ username, password } = this.cleanupInput(username, password));
		const account = await this.authenticationService.loadAccount(username);
		const accountPassword = this.checkValue(account.password, new UnauthorizedException());

		this.authenticationService.checkBrutForce(account);
		if (!(await bcrypt.compare(password, accountPassword))) {
			await this.authenticationService.updateLastTriedFailedLogin(account.id);
			throw new UnauthorizedException();
		}

		const accountUserId = this.checkValue(
			account.userId,
			new Error(`login failing, because account ${account.id} has no userId`)
		);
		const user = await this.userRepo.findById(accountUserId);
		const currentUser = CurrentUserMapper.userToICurrentUser(account.id, user);
		return currentUser;
	}

	private cleanupInput(username?: string, password?: string): { username: string; password: string } {
		username = this.checkValue(username, new UnauthorizedException());
		password = this.checkValue(password, new UnauthorizedException());
		username = this.authenticationService.normalizeUsername(username);
		password = this.authenticationService.normalizePassword(password);
		return { username, password };
	}

	/*
	private async checkCredentials(username: string, password: string): Promise<unknown> {
		const query = QueryString.stringify({
			client_id: this.kcSettings.clientId,
			client_secret: '',
			username,
			password,
			grant_type: 'password',
		});
		const url = `${this.kcSettings.baseUrl}/${query}`;
		const response = await this.httpService.get(url, config);
		return Promise.resolve();
	}
*/
	private checkValue<T>(value: T | null | undefined, error: unknown): T | never {
		if (value === null || value === undefined) {
			throw error;
		}
		return value;
	}
}
