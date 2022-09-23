import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Body, Controller, Delete, Get, NotImplementedException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { LoginResponse, RedirectResponse } from '@shared/infra/oauth-provider/dto';
import { ICurrentUser } from '@shared/domain';
import { OauthProviderLoginFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.login-flow.uc';
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
	constructor(private readonly oauthProviderLoginFlowUc: OauthProviderLoginFlowUc) {}

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
	async getLoginRequest(@Param() params: ChallengeParams): Promise<LoginResponse> {
		const loginResponse: LoginResponse = await this.oauthProviderLoginFlowUc.getLoginRequest(params.challenge);
		// TODO Mapping like https://github.com/hpi-schul-cloud/schulcloud-server/blob/2a8257759811eb52109ba75d87d1d8a322514e77/apps/server/src/modules/oauth-provider/controller/oauth-provider.controller.ts#L111-L111
		return loginResponse;
	}

	@Authenticate('jwt')
	@Patch('loginRequest/:challenge')
	async patchLoginRequest(
		@Param() params: ChallengeParams,
		@Query() query: AcceptQuery,
		@Body() body: LoginRequestBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<RedirectResponse> {
		const redirect: RedirectResponse = await this.oauthProviderLoginFlowUc.patchLoginRequest(
			currentUser.userId,
			params.challenge,
			body,
			query
		);
		// TODO Mapping like https://github.com/hpi-schul-cloud/schulcloud-server/blob/2a8257759811eb52109ba75d87d1d8a322514e77/apps/server/src/modules/oauth-provider/controller/oauth-provider.controller.ts#L111-L111
		// Mapper und Test
		// https://github.com/hpi-schul-cloud/schulcloud-server/blob/2a8257759811eb52109ba75d87d1d8a322514e77/apps/server/src/modules/oauth-provider/mapper/oauth-provider-response.mapper.ts#L17-L17
		// https://github.com/hpi-schul-cloud/schulcloud-server/blob/2a8257759811eb52109ba75d87d1d8a322514e77/apps/server/src/modules/oauth-provider/mapper/oauth-provider-response.mapper.spec.ts#L132-L132
		return redirect;
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
