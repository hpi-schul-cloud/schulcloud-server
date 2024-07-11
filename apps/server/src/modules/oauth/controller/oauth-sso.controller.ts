import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Controller, Get, Param, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LegacyLogger } from '@src/core/logger';
import { Request } from 'express';
import { OAuthTokenDto } from '../interface';
import { HydraOauthUc } from '../uc';
import { AuthorizationParams } from './dto';
import { StatelessAuthorizationParams } from './dto/stateless-authorization.params';

/**
 * @deprecated To be removed in N21-2071
 */
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
		@CurrentUser() currentUser: ICurrentUser,
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
		return this.hydraUc.requestAuthCode(jwt, oauthClientId);
	}
}
