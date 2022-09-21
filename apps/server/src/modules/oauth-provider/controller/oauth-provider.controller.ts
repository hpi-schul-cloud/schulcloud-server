import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Body, Controller, Delete, Get, NotImplementedException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { ICurrentUser } from '@shared/domain/index';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto';
import {
	AcceptQuery,
	ChallengeParams,
	ConsentRequestBody,
	ConsentSessionResponse,
	IdParams,
	ListOauthClientsParams,
	LoginRequestBody,
	OauthClientBody,
	RedirectBody,
	RevokeConsentParams,
} from './dto';

@Controller('oauth2')
export class OauthProviderController {
	constructor(
		private readonly oauthProviderUc: OauthProviderUc,
		private readonly oauthProviderResponseMapper: OauthProviderResponseMapper
	) {}

	@Authenticate('jwt')
	@Get('clients/:id')
	getOAuth2Client(@Param() params: IdParams) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Get('clients')
	listOAuth2Clients(@Param() params: ListOauthClientsParams) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Post('clients')
	createOAuth2Client(@Body() body: OauthClientBody) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Put('clients/:id')
	updateOAuth2Client(@Param() params: IdParams, @Body() body: OauthClientBody) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Delete('clients/:id')
	deleteOAuth2Client(@Param() params: IdParams) {
		throw new NotImplementedException();
	}

	@Get('loginRequest/:challenge')
	getLoginRequest(@Param() params: ChallengeParams) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Patch('loginRequest/:challenge')
	patchLoginRequest(@Param() params: ChallengeParams, @Query() query: AcceptQuery, @Body() body: LoginRequestBody) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Patch('logoutRequest/:challenge')
	acceptLogoutRequest(@Param() params: ChallengeParams, @Body() body: RedirectBody) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Get('consentRequest/:challenge')
	getConsentRequest(@Param() params: ChallengeParams) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Patch('consentRequest/:challenge')
	patchConsentRequest(@Param() params: ChallengeParams, @Query() query: AcceptQuery, @Body() body: ConsentRequestBody) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Get('auth/sessions/consent')
	async listConsentSessions(@CurrentUser() currentUser: ICurrentUser): Promise<ConsentSessionResponse[]> {
		const sessions: ProviderConsentSessionResponse[] = await this.oauthProviderUc.listConsentSessions(
			currentUser.userId
		);
		const mapped: ConsentSessionResponse[] = sessions.map(
			(session: ProviderConsentSessionResponse): ConsentSessionResponse =>
				this.oauthProviderResponseMapper.mapConsentSessionsToResponse(session)
		);
		return mapped;
	}

	@Authenticate('jwt')
	@Delete('auth/sessions/consent')
	revokeConsentSession(@CurrentUser() currentUser: ICurrentUser, @Param() params: RevokeConsentParams): Promise<void> {
		const promise: Promise<void> = this.oauthProviderUc.revokeConsentSession(currentUser.userId, params.client);
		return promise;
	}

	@Get('baseUrl')
	getUrl(): Promise<string> {
		return Promise.resolve(Configuration.get('HYDRA_URI') as string);
	}
}
