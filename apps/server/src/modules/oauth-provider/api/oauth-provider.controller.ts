import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
	ProviderConsentResponse,
	ProviderConsentSessionResponse,
	ProviderLoginResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
} from '../domain';
import {
	AcceptQuery,
	ChallengeParams,
	ConsentRequestBody,
	ConsentResponse,
	ConsentSessionResponse,
	IdParams,
	ListOauthClientsParams,
	LoginRequestBody,
	LoginResponse,
	OauthClientCreateBody,
	OauthClientResponse,
	OauthClientUpdateBody,
	RedirectResponse,
	RevokeConsentParams,
} from './dto';
import { OauthProviderResponseMapper } from './mapper';
import { OauthProviderClientCrudUc } from './oauth-provider.client-crud.uc';
import { OauthProviderConsentFlowUc } from './oauth-provider.consent-flow.uc';
import { OauthProviderLoginFlowUc } from './oauth-provider.login-flow.uc';
import { OauthProviderLogoutFlowUc } from './oauth-provider.logout-flow.uc';
import { OauthProviderSessionUc } from './oauth-provider.session.uc';

@Controller('oauth2')
@ApiTags('Oauth2')
export class OauthProviderController {
	constructor(
		private readonly consentFlowUc: OauthProviderConsentFlowUc,
		private readonly logoutFlowUc: OauthProviderLogoutFlowUc,
		private readonly crudUc: OauthProviderClientCrudUc,
		private readonly oauthProviderUc: OauthProviderSessionUc,
		private readonly oauthProviderLoginFlowUc: OauthProviderLoginFlowUc
	) {}

	@JwtAuthentication()
	@Get('clients/:id')
	public async getOAuth2Client(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: IdParams
	): Promise<OauthClientResponse> {
		const client: ProviderOauthClient = await this.crudUc.getOAuth2Client(currentUser.userId, params.id);

		const mapped: OauthClientResponse = OauthProviderResponseMapper.mapOauthClientResponse(client);

		return mapped;
	}

	@JwtAuthentication()
	@Get('clients')
	public async listOAuth2Clients(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ListOauthClientsParams
	): Promise<OauthClientResponse[]> {
		const clients: ProviderOauthClient[] = await this.crudUc.listOAuth2Clients(
			currentUser.userId,
			params.limit,
			params.offset,
			params.client_name,
			params.owner
		);

		const mapped: OauthClientResponse[] = clients.map(
			(client: ProviderOauthClient): OauthClientResponse => OauthProviderResponseMapper.mapOauthClientResponse(client)
		);

		return mapped;
	}

	@JwtAuthentication()
	@Post('clients')
	public async createOAuth2Client(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() body: OauthClientCreateBody
	): Promise<OauthClientResponse> {
		const client: ProviderOauthClient = await this.crudUc.createOAuth2Client(currentUser.userId, body);

		const mapped: OauthClientResponse = OauthProviderResponseMapper.mapOauthClientResponse(client);

		return mapped;
	}

	@JwtAuthentication()
	@Put('clients/:id')
	public async updateOAuth2Client(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: IdParams,
		@Body() body: OauthClientUpdateBody
	): Promise<OauthClientResponse> {
		const client: ProviderOauthClient = await this.crudUc.updateOAuth2Client(currentUser.userId, params.id, body);

		const mapped: OauthClientResponse = OauthProviderResponseMapper.mapOauthClientResponse(client);

		return mapped;
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@JwtAuthentication()
	@Delete('clients/:id')
	public deleteOAuth2Client(@CurrentUser() currentUser: ICurrentUser, @Param() params: IdParams): Promise<void> {
		const promise: Promise<void> = this.crudUc.deleteOAuth2Client(currentUser.userId, params.id);

		return promise;
	}

	@Get('loginRequest/:challenge')
	public async getLoginRequest(@Param() params: ChallengeParams): Promise<LoginResponse> {
		const loginResponse: ProviderLoginResponse = await this.oauthProviderLoginFlowUc.getLoginRequest(params.challenge);

		const mapped: LoginResponse = OauthProviderResponseMapper.mapLoginResponse(loginResponse);

		return mapped;
	}

	@JwtAuthentication()
	@Patch('loginRequest/:challenge')
	public async patchLoginRequest(
		@Param() params: ChallengeParams,
		@Query() query: AcceptQuery,
		@Body() body: LoginRequestBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<RedirectResponse> {
		const redirectResponse: ProviderRedirectResponse = await this.oauthProviderLoginFlowUc.patchLoginRequest(
			currentUser.userId,
			params.challenge,
			body,
			query
		);

		const mapped: RedirectResponse = OauthProviderResponseMapper.mapRedirectResponse(redirectResponse);

		return mapped;
	}

	@JwtAuthentication()
	@Patch('logoutRequest/:challenge')
	public async acceptLogoutRequest(@Param() params: ChallengeParams): Promise<RedirectResponse> {
		const redirect: ProviderRedirectResponse = await this.logoutFlowUc.logoutFlow(params.challenge);

		const mapped: RedirectResponse = OauthProviderResponseMapper.mapRedirectResponse(redirect);

		return mapped;
	}

	@JwtAuthentication()
	@Get('consentRequest/:challenge')
	public async getConsentRequest(@Param() params: ChallengeParams): Promise<ConsentResponse> {
		const consentRequest: ProviderConsentResponse = await this.consentFlowUc.getConsentRequest(params.challenge);

		const mapped: ConsentResponse = OauthProviderResponseMapper.mapConsentResponse(consentRequest);

		return mapped;
	}

	@JwtAuthentication()
	@Patch('consentRequest/:challenge')
	public async patchConsentRequest(
		@Param() params: ChallengeParams,
		@Query() query: AcceptQuery,
		@Body() body: ConsentRequestBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<RedirectResponse> {
		const redirectResponse: ProviderRedirectResponse = await this.consentFlowUc.patchConsentRequest(
			currentUser.userId,
			params.challenge,
			query.accept,
			body
		);

		const response: RedirectResponse = OauthProviderResponseMapper.mapRedirectResponse(redirectResponse);

		return response;
	}

	@JwtAuthentication()
	@Get('auth/sessions/consent')
	public async listConsentSessions(@CurrentUser() currentUser: ICurrentUser): Promise<ConsentSessionResponse[]> {
		const sessions: ProviderConsentSessionResponse[] = await this.oauthProviderUc.listConsentSessions(
			currentUser.userId
		);

		const mapped: ConsentSessionResponse[] = sessions.map(
			(session: ProviderConsentSessionResponse): ConsentSessionResponse =>
				OauthProviderResponseMapper.mapConsentSessionsToResponse(session)
		);

		return mapped;
	}

	@JwtAuthentication()
	@Delete('auth/sessions/consent')
	public revokeConsentSession(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() query: RevokeConsentParams
	): Promise<void> {
		const promise: Promise<void> = this.oauthProviderUc.revokeConsentSession(currentUser.userId, query.client);

		return promise;
	}
}
