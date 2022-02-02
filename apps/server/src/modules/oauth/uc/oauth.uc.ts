import { Injectable } from '@nestjs/common';
import { ILogger, Logger } from '@src/core/logger';
import axios, { AxiosResponse } from 'axios';
import jwtDecode from 'jwt-decode';
import { SystemRepo } from '@shared/repo/system';
import { UserRepo } from '@shared/repo';
import { System, User } from '@shared/domain';
import { FeathersJwtProvider } from '@src/modules/authorization/feathers-jwt.provider';
import { TokenRequestPayload } from '../controller/dto/token-request-payload';
import { OauthTokenResponse } from '../controller/dto/oauth-token-response';
import { AuthorizationQuery } from '../controller/dto/authorization.query';
import { OAuthResponse } from '../controller/dto/oauth-response';
import { TokenRequestPayloadMapper } from '../mapper/token-request-payload.mapper';

@Injectable()
export class OauthUc {
	private logger: ILogger;

	constructor(
		private readonly systemRepo: SystemRepo,
		private readonly userRepo: UserRepo,
		private readonly jwtService: FeathersJwtProvider
	) {
		this.logger = new Logger(OauthUc.name);
	}

	// 0- start Oauth Process
	async startOauth(query: AuthorizationQuery, systemId: string): Promise<OAuthResponse> {
		try {
			// get the authorization code
			const code: string = this.checkAuthorizationCode(query);
			// get the Tokens using the authorization code
			const queryToken: OauthTokenResponse = await this.requestToken(code, systemId);
			// extract the uuid from the token
			const uuid = this.decodeToken(queryToken.id_token);
			// get the user using the uuid
			const user: User = await this.findUserById(uuid);
			// create JWT for the user
			const jwt: string = await this.getJWTForUser(user);
			// send response back
			const response: OAuthResponse = new OAuthResponse();
			response.jwt = jwt;
			return response;
		} catch (error) {
			this.logger.log(error);
		}
		// send error response back
		const response: OAuthResponse = new OAuthResponse();
		response.errorcode = 'OauthLoginFailed';
		return response;
	}

	/**
	 * @query query input that has either a code or an error
	 * @return authorization code or throws an error
	 */
	checkAuthorizationCode(query: AuthorizationQuery): string {
		if (query.code) return query.code;
		if (query.error) throw new Error(query.error);
		throw new Error('Authorization Query Object has no authorization code or error');
	}

	// 1- use Authorization Code to get a valid Token
	async requestToken(code: string, systemId: string): Promise<OauthTokenResponse> {
		const system: System = await this.systemRepo.findById(systemId);
		// const tokenRequestPayload: TokenRequestPayload = this.mapSystemConfigtoPayload(system, code);
		const tokenRequestPayload: TokenRequestPayload = TokenRequestPayloadMapper.mapToResponse(system, code);
		const responseToken: AxiosResponse<OauthTokenResponse> = await axios.post(
			tokenRequestPayload.token_endpoint,
			{},
			{ params: { ...tokenRequestPayload.tokenRequestParams } }
		);
		return responseToken.data;
	}

	// 2- decode the Token to extract the UUID
	decodeToken(token: string): string {
		const decodedJwt: IJWT = jwtDecode(token);
		if (!decodedJwt || !decodedJwt.uuid) throw Error('Filed to extract uuid');
		const { uuid } = decodedJwt;
		if (!uuid || uuid.length === 0) {
			throw Error('Failed to extract uuid');
		}
		return uuid;
	}

	// 1.1- Token Validation? (later)

	// 3- get user using the UUID (userHelpers.js?)
	async findUserById(uuid: string): Promise<User> {
		const user = await this.userRepo.findByLdapId(uuid);
		return user;
	}

	// 3.1- User bestätigen?

	// 4- JWT erzeugen (oder finden)
	async getJWTForUser(user: User): Promise<string> {
		const jwt: string = await this.jwtService.generateJwt(user.id);
		return jwt;
	}
}

export interface IJWT {
	uuid: string;
}
