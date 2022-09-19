import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Body, Controller, Delete, Get, NotImplementedException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { RedirectResponse } from '@src/modules/oauth-provider/controller/dto/response/redirect.response';
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

	@Post('introspect')
	introspectOAuth2Token(@Body() body: IntrospectBody) {
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
		return this.oauthProviderUc.getConsentRequest(params.challenge);
	}

	@Authenticate('jwt')
	@Patch('consentRequest/:challenge')
	async patchConsentRequest(
		@Param() params: ChallengeParams,
		@Query() query: AcceptQuery,
		@Body() body: ConsentRequestBody
	): Promise<RedirectResponse> {
		const redirectResponse: RedirectResponse = await this.oauthProviderUc.patchConsentRequest(
			params.challenge,
			query,
			body
		);
		const response: RedirectResponse = this.oauthProviderResponseMapper.mapRedirectResponse(redirectResponse);
		return response;
	}

	@Authenticate('jwt')
	@Get('auth/sessions/consent/:userId')
	listConsentSessions(@Param() params: UserParams) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Delete('auth/sessions/consent/:userId')
	revokeConsentSession(@Param() params: UserParams, @Query() query: RevokeConsentQuery) {
		throw new NotImplementedException();
	}

	@Get('baseUrl')
	getUrl(): Promise<string> {
		return Promise.resolve(Configuration.get('HYDRA_URI') as string);
	}
}
