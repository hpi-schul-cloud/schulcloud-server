import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Body, Controller, Delete, Get, NotImplementedException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { LoginResponse, RedirectResponse } from '@shared/infra/oauth-provider/dto';
import { ICurrentUser } from '@shared/domain';
import {
	AcceptQuery,
	ChallengeParams,
	ConsentRequestBody,
	IdParams,
	IntrospectBody,
	ListOauthClientsParams,
	LoginRequestBody,
	OauthClientBody,
	RedirectBody,
	RevokeConsentQuery,
	UserParams,
} from './dto';

@Controller('oauth2')
export class OauthProviderController {
	constructor(
		private readonly oauthProviderUc: OauthProviderUc,
		private readonly oauthProviderResponseMapper: OauthProviderResponseMapper
	) {}

	@Authenticate('jwt')
	@Get('clients/:id')
	getOAuth2Client(@Param() { id }: IdParams) {
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
	updateOAuth2Client(@Param() { id }: IdParams, @Body() body: OauthClientBody) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Delete('clients/:id')
	deleteOAuth2Client(@Param() { id }: IdParams) {
		throw new NotImplementedException();
	}

	@Post('introspect')
	introspectOAuth2Token(@Body() { token }: IntrospectBody) {
		throw new NotImplementedException();
	}

	@Get('loginRequest/:challenge')
	getLoginRequest(@Param() params: ChallengeParams): Promise<LoginResponse> {
		return this.oauthProviderUc.getLoginRequest(params.challenge);
	}

	@Authenticate('jwt')
	@Patch('loginRequest/:challenge')
	patchLoginRequest(
		@Param() { challenge }: ChallengeParams,
		@Query() query: AcceptQuery,
		@Body() body: LoginRequestBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<RedirectResponse> {
		return this.oauthProviderUc.patchLoginRequest(currentUser.userId, challenge, body, query);
	}

	@Authenticate('jwt')
	@Patch('logoutRequest/:challenge')
	acceptLogoutRequest(@Param() { challenge }: ChallengeParams, @Body() body: RedirectBody) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Get('consentRequest/:challenge')
	getConsentRequest(@Param() { challenge }: ChallengeParams) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Patch('consentRequest/:challenge')
	patchConsentRequest(
		@Param() { challenge }: ChallengeParams,
		@Query() query: AcceptQuery,
		@Body() body: ConsentRequestBody
	) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Get('auth/sessions/consent/:userId')
	listConsentSessions(@Param() { userId }: UserParams) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Delete('auth/sessions/consent/:user')
	revokeConsentSession(@Param() { userId }: UserParams, @Query() { client }: RevokeConsentQuery) {
		throw new NotImplementedException();
	}

	@Get('baseUrl')
	getUrl(): Promise<string> {
		return Promise.resolve(Configuration.get('HYDRA_URI') as string);
	}
}
