import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Body, Controller, Delete, Get, NotImplementedException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { OauthClient } from '@shared/infra/oauth-provider/dto/index';
import { RoleName } from '@shared/domain/index';
import { RequireRole } from '@src/modules/authorization';
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
} from './dto';

@Controller('oauth2')
export class OauthProviderController {
	constructor(
		private readonly oauthProviderUc: OauthProviderUc,
		private readonly oauthProviderResponseMapper: OauthProviderResponseMapper
	) {}

	@RequireRole(RoleName.SUPERHERO)
	@Authenticate('jwt')
	@Get('clients/:id')
	async getOAuth2Client(@Param() params: IdParams): Promise<OauthClientResponse> {
		const client: OauthClient = await this.oauthProviderUc.getOAuth2Client(params.id);
		const mapped: OauthClientResponse = this.oauthProviderResponseMapper.mapOauthClientToClientResponse(client);
		return mapped;
	}

	@RequireRole(RoleName.SUPERHERO)
	@Authenticate('jwt')
	@Get('clients')
	async listOAuth2Clients(@Param() params: ListOauthClientsParams): Promise<OauthClientResponse[]> {
		const clients: OauthClient[] = await this.oauthProviderUc.listOAuth2Clients(
			params.limit,
			params.offset,
			params.client_name,
			params.owner
		);
		const mapped: OauthClientResponse[] = clients.map(
			(client: OauthClient): OauthClientResponse =>
				this.oauthProviderResponseMapper.mapOauthClientToClientResponse(client)
		);
		return mapped;
	}

	@RequireRole(RoleName.SUPERHERO)
	@Authenticate('jwt')
	@Post('clients')
	async createOAuth2Client(@Body() body: OauthClientBody): Promise<OauthClientResponse> {
		const client: OauthClient = await this.oauthProviderUc.createOAuth2Client(body);
		const mapped: OauthClientResponse = this.oauthProviderResponseMapper.mapOauthClientToClientResponse(client);
		return mapped;
	}

	@RequireRole(RoleName.SUPERHERO)
	@Authenticate('jwt')
	@Put('clients/:id')
	async updateOAuth2Client(@Param() params: IdParams, @Body() body: OauthClientBody): Promise<OauthClientResponse> {
		const client: OauthClient = await this.oauthProviderUc.updateOAuth2Client(params.id, body);
		const mapped: OauthClientResponse = this.oauthProviderResponseMapper.mapOauthClientToClientResponse(client);
		return mapped;
	}

	@RequireRole(RoleName.SUPERHERO)
	@Authenticate('jwt')
	@Delete('clients/:id')
	deleteOAuth2Client(@Param() params: IdParams): Promise<void> {
		return this.oauthProviderUc.deleteOAuth2Client(params.id);
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
		throw new NotImplementedException();
	}

	@Authenticate('jwt')
	@Patch('consentRequest/:challenge')
	patchConsentRequest(@Param() params: ChallengeParams, @Query() query: AcceptQuery, @Body() body: ConsentRequestBody) {
		throw new NotImplementedException();
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
