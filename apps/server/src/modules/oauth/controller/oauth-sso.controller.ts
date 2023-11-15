import { Authenticate, CurrentUser, CurrentUserInterface } from '@modules/authentication';
import { Controller, Get, Param, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LegacyLogger } from '@src/core/logger';
import { Request } from 'express';
import { OAuthTokenDto } from '../interface';
import { HydraOauthUc } from '../uc';
import { AuthorizationParams } from './dto';
import { StatelessAuthorizationParams } from './dto/stateless-authorization.params';
import { UserMigrationResponse } from './dto/user-migration.response';

@ApiTags('SSO')
@Controller('sso')
export class OauthSSOController {
	constructor(private readonly hydraUc: HydraOauthUc, private readonly logger: LegacyLogger) {
		this.logger.setContext(OauthSSOController.name);
	}

	@Get('hydra/:oauthClientId')
	@Authenticate('jwt')
	async getHydraOauthToken(
		@Query() query: StatelessAuthorizationParams,
		@Param('oauthClientId') oauthClientId: string
	): Promise<OAuthTokenDto> {
		const oauthToken = this.hydraUc.getOauthToken(oauthClientId, query.code, query.error);
		return oauthToken;
	}

	@Get('auth/:oauthClientId')
	@Authenticate('jwt')
	async requestAuthToken(
		@CurrentUser() currentUser: CurrentUserInterface,
		@Req() req: Request,
		@Param('oauthClientId') oauthClientId: string
	): Promise<AuthorizationParams> {
		let jwt: string;
		const authHeader: string | undefined = req.headers.authorization;
		if (authHeader?.toLowerCase()?.startsWith('bearer ')) {
			[, jwt] = authHeader.split(' ');
		} else {
			throw new UnauthorizedException(
				`No bearer token in header for authorization process of user ${currentUser.userId} on oauth system ${oauthClientId}`
			);
		}
		return this.hydraUc.requestAuthCode(currentUser.userId, jwt, oauthClientId);
	}
<<<<<<< HEAD

	@Get('oauth/migration')
	@Authenticate('jwt')
	@ApiOkResponse({ description: 'The User has been succesfully migrated.' })
	@ApiResponse({ type: InternalServerErrorException, description: 'The migration of the User was not possible. ' })
	async migrateUser(
		@JWT() jwt: string,
		@Session() session: ISession,
		@CurrentUser() currentUser: CurrentUserInterface,
		@Query() query: AuthorizationParams,
		@Res() res: Response
	): Promise<void> {
		const oauthLoginState: OauthLoginStateDto = this.sessionHandler(session, query);

		if (!currentUser.systemId) {
			throw new UnprocessableEntityException('Current user does not have a system.');
		}

		try {
			const migration: MigrationDto = await this.oauthUc.migrate(jwt, currentUser.userId, query, oauthLoginState);
			const response: UserMigrationResponse = UserMigrationMapper.mapDtoToResponse(migration);
			res.redirect(response.redirect);
		} catch (error) {
			this.migrationErrorHandler(error, session, res);
		}
	}
=======
>>>>>>> main
}
