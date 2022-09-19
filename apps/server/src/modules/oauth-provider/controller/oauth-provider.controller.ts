import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Body, Controller, Delete, Get, NotImplementedException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { OauthClient } from '@shared/infra/oauth-provider/dto/index';
import {
	AcceptQuery,
	ChallengeParams,
	ConsentRequestBody,
	IdParams,
	IntrospectBody,
	ListOauthClientsParams,
	LoginRequestBody,
	OauthClientBody,
	OauthClientResponse,
	RedirectBody,
	RevokeConsentQuery,
	UserParams,
} from './dto/index';

@Controller('oauth2')
export class OauthProviderController {
	constructor(
		private readonly oauthProviderUc: OauthProviderUc,
		private readonly oauthProviderResponseMapper: OauthProviderResponseMapper
	) {}

	@Authenticate('jwt')
	@Get('clients/:id')
	async getOAuth2Client(@Param() { id }: IdParams): Promise<OauthClientResponse> {
		const client: OauthClient = await this.oauthProviderUc.getOAuth2Client(id);
		const mapped: OauthClientResponse = this.oauthProviderResponseMapper.mapOauthClientToClientResponse(client);
		return mapped;
	}

	@Authenticate('jwt')
	@Get('clients')
	async listOAuth2Clients(@Param() params: ListOauthClientsParams): Promise<OauthClientResponse[]> {
		const clients: OauthClient[] = await this.oauthProviderUc.listOAuth2Clients();
		const mapped: OauthClientResponse[] = clients.map(
			(client: OauthClient): OauthClientResponse =>
				this.oauthProviderResponseMapper.mapOauthClientToClientResponse(client)
		);
		return mapped;
	}

	@Authenticate('jwt')
	@Post('clients')
	async createOAuth2Client(@Body() body: OauthClientBody): Promise<OauthClientResponse> {
		const client: OauthClient = await this.oauthProviderUc.createOAuth2Client(body);
		const mapped: OauthClientResponse = this.oauthProviderResponseMapper.mapOauthClientToClientResponse(client);
		return mapped;
	}

	@Authenticate('jwt')
	@Put('clients/:id')
	async updateOAuth2Client(@Param() { id }: IdParams, @Body() body: OauthClientBody): Promise<OauthClientResponse> {
		const client: OauthClient = await this.oauthProviderUc.updateOAuth2Client(id, body);
		const mapped: OauthClientResponse = this.oauthProviderResponseMapper.mapOauthClientToClientResponse(client);
		return mapped;
	}

	@Authenticate('jwt')
	@Delete('clients/:id')
	deleteOAuth2Client(@Param() { id }: IdParams): Promise<void> {
		return this.oauthProviderUc.deleteOAuth2Client(id);
	}

	@Post('introspect')
	introspectOAuth2Token(@Body() { token }: IntrospectBody) {
		throw new NotImplementedException();
	}

	@Get('loginRequest/:challenge')
	getLoginRequest(@Param() { challenge }: ChallengeParams) {
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Patch('loginRequest/:challenge')
	patchLoginRequest(
		@Param() { challenge }: ChallengeParams,
		@Query() query: AcceptQuery,
		@Body() body: LoginRequestBody
	) {
		throw new NotImplementedException();
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
