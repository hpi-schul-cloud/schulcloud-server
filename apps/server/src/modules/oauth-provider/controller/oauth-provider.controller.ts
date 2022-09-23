import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Body, Controller, Delete, Get, NotImplementedException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { OauthProviderLogoutFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.logout-flow.uc';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { OauthClient, ProviderConsentSessionResponse, RedirectResponse } from '@shared/infra/oauth-provider/dto';
import { ICurrentUser } from '@shared/domain';
import { OauthProviderClientCrudUc } from '@src/modules/oauth-provider/uc/oauth-provider.client-crud.uc';
import { IntrospectBody } from '@src/modules/oauth-provider/controller/dto/request/introspect.body';
import {
	AcceptQuery,
	ChallengeParams,
	ConsentRequestBody,
	ConsentSessionResponse,
	IdParams,
	ListOauthClientsParams,
	LoginRequestBody,
	OauthClientBody,
	OauthClientResponse,
	RedirectBody,
	RevokeConsentParams,
} from './dto';
import { OauthProviderUc } from '../uc/oauth-provider.uc';

@Controller('oauth2')
export class OauthProviderController {
	constructor(
		private readonly crudUc: OauthProviderClientCrudUc,
		private readonly oauthProviderUc: OauthProviderUc,
		private readonly logoutFlowUc: OauthProviderLogoutFlowUc,
		private readonly oauthProviderResponseMapper: OauthProviderResponseMapper
	) {}

	@Authenticate('jwt')
	@Get('clients/:id')
	async getOAuth2Client(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: IdParams
	): Promise<OauthClientResponse> {
		const client: OauthClient = await this.crudUc.getOAuth2Client(currentUser, params.id);
		const mapped: OauthClientResponse = this.oauthProviderResponseMapper.mapOauthClientToClientResponse(client);
		return mapped;
	}

	@Authenticate('jwt')
	@Get('clients')
	async listOAuth2Clients(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ListOauthClientsParams
	): Promise<OauthClientResponse[]> {
		const clients: OauthClient[] = await this.crudUc.listOAuth2Clients(
			currentUser,
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

	@Authenticate('jwt')
	@Post('clients')
	async createOAuth2Client(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() body: OauthClientBody
	): Promise<OauthClientResponse> {
		const client: OauthClient = await this.crudUc.createOAuth2Client(currentUser, body);
		const mapped: OauthClientResponse = this.oauthProviderResponseMapper.mapOauthClientToClientResponse(client);
		return mapped;
	}

	@Authenticate('jwt')
	@Put('clients/:id')
	async updateOAuth2Client(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: IdParams,
		@Body() body: OauthClientBody
	): Promise<OauthClientResponse> {
		const client: OauthClient = await this.crudUc.updateOAuth2Client(currentUser, params.id, body);
		const mapped: OauthClientResponse = this.oauthProviderResponseMapper.mapOauthClientToClientResponse(client);
		return mapped;
	}

	@Authenticate('jwt')
	@Delete('clients/:id')
	deleteOAuth2Client(@CurrentUser() currentUser: ICurrentUser, @Param() params: IdParams): Promise<void> {
		const promise: Promise<void> = this.crudUc.deleteOAuth2Client(currentUser, params.id);
		return promise;
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
	async acceptLogoutRequest(@Param() params: ChallengeParams, @Body() body: RedirectBody) {
		const redirect: RedirectResponse = await this.logoutFlowUc.logoutFlow(params.challenge);
		return redirect.redirect_to;
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

	@Post('introspect')
	introspectOAuth2Token(@Body() body: IntrospectBody) {
		throw new NotImplementedException();
	}

	@Get('baseUrl')
	getUrl(): Promise<string> {
		return Promise.resolve(Configuration.get('HYDRA_URI') as string);
	}
}
