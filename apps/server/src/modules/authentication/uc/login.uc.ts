import { ICurrentUser, JwtPayloadBuilder } from '@infra/auth-guard';
import { AuditLogger } from '@infra/logger';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { UserService } from '@modules/user';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { SessionInfoResponse } from '../controllers/dto';
import { AuthenticationService } from '../services';

@Injectable()
export class LoginUc {
	constructor(
		private readonly authService: AuthenticationService,
		@Inject(AUTHENTICATION_CONFIG_TOKEN) private readonly config: AuthenticationConfig,
		private readonly auditLogger: AuditLogger,
		private readonly authorizationService: AuthorizationService,
		private readonly userService: UserService
	) {}

	public async getLoginData(currentUser: ICurrentUser): Promise<string> {
		this.checkIfNotServiceAccount(currentUser);
		const jwtPayload = new JwtPayloadBuilder(currentUser).build();
		const accessToken = await this.authService.generateJwtAndAddToWhitelist(jwtPayload, this.config.expiresIn);
		await this.authService.updateLastLogin(currentUser.accountId);

		return accessToken;
	}

	public async getLoginDataForServiceAccount(currentUser: ICurrentUser): Promise<string> {
		this.checkIfServiceAccount(currentUser);
		const jwtPayload = new JwtPayloadBuilder(currentUser).asServiceAccount().build();
		const accessToken = await this.authService.generateJwtAndAddToWhitelist(
			jwtPayload,
			this.config.jwtLifetimeServiceAccountSeconds
		);
		await this.authService.updateLastLogin(currentUser.accountId);

		this.auditLogger.logServiceAccountAction(currentUser.userId, 'ServiceAccountAuthenticated');

		return accessToken;
	}

	public async getJwtTtlFromWhitelist(accessToken: string): Promise<SessionInfoResponse> {
		const result = await this.authService.getJwtTtlFromWhitelist(accessToken);

		const sessionInfoResponse = new SessionInfoResponse(result);

		return sessionInfoResponse;
	}

	public async getSupportLoginData(targetUserId: EntityId, supportUserId: EntityId): Promise<string> {
		const [authorizableUser, targetUserWithRoles, targetUser] = await Promise.all([
			this.authorizationService.getUserWithPermissions(supportUserId),
			this.authorizationService.getUserWithPermissions(targetUserId),
			this.userService.findById(targetUserId),
		]);

		const authContext = AuthorizationContextBuilder.write([
			Permission.CREATE_SUPPORT_JWT,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
		]);
		this.authorizationService.checkPermission(authorizableUser, targetUser, authContext);

		const jwtToken = await this.authService.generateSupportJwt(authorizableUser, targetUserWithRoles);

		return jwtToken;
	}

	private checkIfServiceAccount(currentUser: ICurrentUser): void {
		if (!currentUser.isServiceAccount) {
			throw new UnauthorizedException();
		}
	}

	private checkIfNotServiceAccount(currentUser: ICurrentUser): void {
		if (currentUser.isServiceAccount) {
			throw new UnauthorizedException();
		}
	}
}
