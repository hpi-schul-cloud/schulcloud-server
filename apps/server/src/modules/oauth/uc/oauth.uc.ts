/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { ILogger, Logger } from '@src/core/logger';
import axios, { AxiosResponse } from 'axios';
import jwtDecode from 'jwt-decode';
import { SystemRepo } from '@shared/repo/system';
import { UserRepo } from '@shared/repo';
import { System, User } from '@shared/domain';
import { Payload } from '../controller/dto/payload';
import { OauthTokenResponse } from '../controller/dto/oauthTokenResponse';
import { SupportJWTService } from '../../../../../../src/services/account/services/SupportJWTService.js';

@Injectable()
export class OauthUc {
	private logger: ILogger;

	constructor(private readonly systemRepo: SystemRepo, private readonly userRepo: UserRepo) {
		this.logger = new Logger(OauthUc.name);
	}

	// 1- use Authorization Code to get a valid Token
	async requestToken(code: string, systemId: string) {
		const system: System = await this.systemRepo.findById(systemId);
		console.log(system);
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

		const responseToken: AxiosResponse<OauthTokenResponse> = await axios.post(
			payload.token_endpoint,
			{},
			{ params: { ...payload.data } }
		);
		return responseToken.data;
	}

	// 2- decode the Token to extract the UUID
	async decodeToken(token: string) {
		try {
			const decodedJwt: IJWT = await jwtDecode(token);
			console.log(`This is the uuid >>>> ${decodedJwt.uuid}`);
			return decodedJwt.uuid;
		} catch (error) {
			console.log('########### Token konnte nicht entschlüsselt werden #####');
			// return res.status....
		}
		return '';
	}

	// 1.1- Token Validation? (later)

	// 3- get user using the UUID (userHelpers.js?)
	findUserById(uuid: string): Promise<User> {
		return this.userRepo.findByLdapId(uuid);
	}

	// 3.1- User bestätigen?

	// 4- JWT erzeugen (oder finden)
	getJWTForUser(user: User) {
		console.log('JWT CREATED:');
		// console.log(SupportJWTService.create(user._id));
	}
}

interface IJWT {
	hmmmm: string;
	uuid: string;
}
