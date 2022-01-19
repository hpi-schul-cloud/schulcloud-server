/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { ILogger, Logger } from '@src/core/logger';
import { env } from 'process';
import axios, { AxiosResponse } from 'axios';
import jwtDecode from 'jwt-decode';
import { Payload } from '../controller/dto/payload';
import { OauthTokenResponse } from '../controller/dto/oauthTokenResponse';
import { response } from 'express';

@Injectable()
export class OauthUc {
	private logger: ILogger;

	constructor() {
		this.logger = new Logger(OauthUc.name);
	}

	// 1- use Authorization Code to get a valid Token
	async requestToken(code: string) {
		console.log(code);
		const payload: Payload = {
			tokenEndpoint: env.TOKEN_ENDPOINT,
			data: {
				client_id: env.CLIENT_ID,
				client_secret: env.CLIENT_SECRET,
				redirect_uri: env.REDIRECT_URI,
				grant_type: env.GRANT_TYPE,
				code,
			},
		};
		if (
			!(
				payload.tokenEndpoint &&
				payload.data.client_id &&
				payload.data.client_secret &&
				payload.data.redirect_uri &&
				payload.data.grant_type
			)
		) {
			throw new Error('check environment variables');
		}
		console.log(payload.data.code);

		const responseToken: AxiosResponse<OauthTokenResponse> = await axios.post(
			payload.tokenEndpoint,
			{},
			{ params: { ...payload.data } }
		);
		console.log(responseToken.data);
		return responseToken.data;
	}
	// 2- decode the Token to extract the UUID

	async decodeToken(token: string) {
		console.log('############################ RESPONSE #############################');
		console.log('response.data  ', token);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		try {
			const decodedJwt: IJWT = await jwtDecode(token);
			console.log(`This is the uuid >>>> ${decodedJwt.uuid}`);
		} catch (error) {
			console.log('########### Token konnte nicht entschlüsselt werden #####');
			console.log('########### KEINE UUID #####');
			// return res.status....
		}
	}

	// 1.1- Token Validation? (later)

	// 3- get user using the UUID (userHelpers.js?)

	// 3.1- User bestätigen?

	// 4- JWT erzeugen (oder finden)
}

interface IJWT {
	hmmmm: string;
	uuid: string;
}
