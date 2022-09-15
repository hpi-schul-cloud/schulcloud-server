import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { AcceptQuery } from '@src/modules/oauth-provider/controller/dto/accept.query';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsentRequestBody } from '@src/modules/oauth-provider/controller/dto/consent-request.body';
import { OauthClientBody } from '@src/modules/oauth-provider/controller/dto/oauth-client.body';
import { IntrospectBody } from '@src/modules/oauth-provider/controller/dto/introspect.body';
import { ListOauthClientsParams } from '@src/modules/oauth-provider/controller/dto/list-oauth-clients.params';
import { IdParams } from './dto/id.params';
import { ChallengeParams } from './dto/challenge.params';
import { LoginRequestBody } from './dto/login-request.body';
import { RedirectBody } from './dto/redirect.body';

// TODO authentication annotations
@Controller('oauth2')
export class OauthProviderController {
	@Get('clients/:id')
	getOAuth2Client(@Param() { id }: IdParams) {}

	@Get('clients')
	listOAuth2Clients(@Param() params: ListOauthClientsParams) {}

	@Post('clients')
	createOAuth2Client(@Body() body: OauthClientBody) {}

	@Put('clients/:id')
	updateOAuth2Client(@Param() { id }: IdParams, @Body() body: OauthClientBody) {}

	@Delete('clients/:id')
	deleteOAuth2Client(@Param() { id }: IdParams) {}

	@Post('introspect')
	introspectOAuth2Token(@Body() { token }: IntrospectBody) {}

	@Get('loginRequest/:challenge')
	getLoginRequest(@Param() { challenge }: ChallengeParams) {}

	@Patch('loginRequest/:challenge')
	patchLoginRequest(
		@Param() { challenge }: ChallengeParams,
		@Query() query: AcceptQuery,
		@Body() body: LoginRequestBody
	) {}

	@Patch('logoutRequest/:challenge')
	acceptLogoutRequest(@Param() { challenge }: ChallengeParams, @Body() body: RedirectBody) {}

	@Get('consentRequest/:challenge')
	getConsentRequest(@Param() { challenge }: ChallengeParams) {}

	@Patch('consentRequest/:challenge')
	patchConsentRequest(
		@Param() { challenge }: ChallengeParams,
		@Query() query: AcceptQuery,
		@Body() body: ConsentRequestBody
	) {}

	@Get('auth/sessions/consent')
	listConsentSessions() {}

	@Delete('auth/sessions/consent')
	revokeConsentSession() {}

	@Get('baseUrl')
	getUrl(): Promise<string> {
		return Promise.resolve(Configuration.get('HYDRA_URI') as string);
	}
}
