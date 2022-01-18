import { Injectable } from '@nestjs/common';
import { ILogger, Logger } from '@src/core/logger';
import { env } from 'process';
import axios, { AxiosResponse } from 'axios';
import jwtDecode from 'jwt-decode';
import { Payload } from '../controller/dto/payload';

@Injectable()
export class OauthUc {
	private logger: ILogger;

	constructor() {
		this.logger = new Logger(OauthUc.name);
	}

	// 1- use Authorization Code to get a valid Token
	async requestToken(code: string) {
		console.log(code, 'juuuuuuuuuuuuuuuuuuuuuuuuuuu');

		const payload: Payload = {
			tokenEndpoint: 'http://iserv.n21.dbildungscloud.de/iserv/auth/public/token',
			data: {
				client_id: '58_qe54d8bh0v4gog8sw0w88c0s8cwwocc8wk8oo00s4c0g8gkc8',
				client_secret: env.CLIENT_SECRET,
				redirect_uri: 'http://localhost:3030/api/v3/oauth/token',
				grant_type: 'authorization_code',
				code,
			},
		};

		try {
			console.log(payload);
			const response: AxiosResponse<OAuthResponse> = await axios.post(
				payload.tokenEndpoint,
				{},
				{ params: { ...payload.data } }
			);
			console.log('############################ RESPONSE #############################');
			console.log('response.data  ', response.data);
			const decodedJwt: IJWT = jwtDecode(response.data.id_token);
			console.log(`This is the uuid >>>> ${decodedJwt.uuid}`);
		} catch (error) {
			console.log('############################ ERROR #############################');
			console.log(error);
		}
	}

	// 1.1- Token Validation? (later)

	// 2- decode the Token to extract the UUID

	// 3- get user using the UUID (userHelpers.js?)

	// 3.1- User bestätigen?

	// 4- JWT erzeugen (oder finden)
}

interface OAuthResponse {
	access_token: string;
	id_token: string;
}

interface IJWT {
	hmmmm: string;
	uuid: string;
}
