import { Injectable } from '@nestjs/common';
import { ILogger, Logger } from '@src/core/logger';
import axios, { AxiosResponse } from 'axios';
import jwtDecode from 'jwt-decode';
import { SystemRepo } from '@shared/repo/system';
import { UserRepo } from '@shared/repo';
import { System, User } from '@shared/domain';
import { FeathersJwtProvider } from '@src/modules/authorization/feathers-jwt.provider';
import { Configuration } from '@hpi-schul-cloud/commons';
import { Payload } from '../controller/dto/payload';
import { OauthTokenResponse } from '../controller/dto/oauthTokenResponse';
import { AuthorizationQuery } from '../controller/dto/authorization.query';
import { OAuthResponse } from '../controller/dto/oauth.response';

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
			const code: string = this.extractCode(query);
			// get the Tokens using the authorization token
			const queryToken: OauthTokenResponse = await this.requestToken(code, systemId);
			// extract the uuid from the token
			const uuid = await this.decodeToken(queryToken.id_token);
			// get the user using the uuid
			const user: User = await this.findUserById(uuid);
			// create JWT for the user
			const jwt: string = await this.getJWTForUser(user);
			// send response back
			const HOST = Configuration.get('HOST') as string;
			const redirectUri = HOST.concat('/dashboard');
			const response: OAuthResponse = new OAuthResponse({
				jwt,
				redirectUri,
			});
			return response;
		} catch (error) {
			this.logger.log(error);
		}
		// send response back
		const HOST = Configuration.get('HOST') as string;
		const redirectUri = HOST.concat('/dashboard');
		const response: OAuthResponse = new OAuthResponse({
			error: 'OAuth Login Failed.',
			redirectUri,
		});
		return response;
	}

	/**
	 * @query query input that has either a code or an error
	 * @return authorization code or throws an error
	 */
	extractCode(query: AuthorizationQuery): string {
		if (query.code) return query.code;
		if (query.error) throw new Error(query.error);
		throw new Error('Authorization Query Object has no authorization code or error');
	}

	mapSystemConfigtoPayload(system: System, code: string): Payload {
		const payload: Payload = {
			token_endpoint: system.oauthconfig?.token_endpoint,
			data: {
				client_id: system.oauthconfig?.client_id,
				client_secret: system.oauthconfig?.client_secret,
				redirect_uri: system.oauthconfig?.token_redirect_uri,
				grant_type: system.oauthconfig?.grant_type,
				code,
			},
		};
		if (
			!(
				payload.token_endpoint &&
				payload.data.client_id &&
				payload.data.client_secret &&
				payload.data.redirect_uri &&
				payload.data.grant_type
			)
		) {
			throw new Error('check environment variables');
		}
		return payload;
	}

	// 1- use Authorization Code to get a valid Token
	async requestToken(code: string, systemId: string) {
		const system: System = await this.systemRepo.findById(systemId);
		const payload: Payload = this.mapSystemConfigtoPayload(system, code);
		const responseToken: AxiosResponse<OauthTokenResponse> = await axios.post(
			payload.token_endpoint,
			{},
			{ params: { ...payload.data } }
		);
		return responseToken.data;
	}

	// 2- decode the Token to extract the UUID
	async decodeToken(token: string): Promise<string> {
		const decodedJwt: IJWT = await jwtDecode(token);
		console.log(`This is the uuid >>>> ${decodedJwt.uuid}`);
		const { uuid } = decodedJwt;
		if (!uuid /** test not empty string or id format */) {
			throw Error('...');
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
		// console.log(SupportJWTService.create(user._id));
	}
}

export interface IJWT {
	uuid: string;
}
