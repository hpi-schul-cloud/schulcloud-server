import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { TspRestClientConfig } from './tsp-rest-client-config';

@Injectable()
export class TSPRestClient {
	private readonly baseUrl: string;

	private readonly clientId: string;

	private readonly clientSecret: string;

	private readonly tokenEndpoint: string;

	private lastToken: string | undefined;

	private lastTokenExpires: number | undefined;

	constructor(
		private readonly configService: ConfigService<TspRestClientConfig, true>,
		private readonly httpService: HttpService
	) {
		this.baseUrl = configService.get<string>('TSP_API_BASE_URL');
		this.clientId = configService.get<string>('TSP_API_CLIENT_ID');
		this.clientSecret = configService.get<string>('TSP_API_CLIENT_SECRET');
		this.tokenEndpoint = configService.get<string>('TSP_API_TOKEN_ENDPOINT');
	}

	private getJwt(lifetime = 30000): string {
		const issueDate = Date.now();

		// check if the current token is still valid
		if (issueDate < this.lastTokenExpires - 1000) {
			return this.lastToken;
		}

		// update the token and expiration date
		this.lastTokenExpires = issueDate + lifetime;

		// create the payload for the jwt
		const payload = {
			apiClientSecret: this.clientSecret, // TSP_API_CLIENT_SECRET
			iss: 'locahost', // process.env.SC_DOMAIN
			aud: this.baseUrl, // TSP_API_BASE_URL
			sub: 'host', // process.env.HOST
			exp: issueDate + lifetime,
			iat: issueDate,
			jti: uuidv4(),
		};

		const token: string = jwt.sign(payload, 'secret');

		// store the token for future use
		this.lastToken = token;

		return token;
	}

	private getHeaders(): Record<string, string> {
		const token = this.getJwt();
		return { Authorization: `AUTH-JWT apiClientId=${'client_id'},jwt=${token}` };
	}

	public request<T>(path: string, lastChange: Date = new Date(0)): Promise<T> {
		const lastChangeDate = moment(lastChange).format('YYYY-MM-DD HH:mm:ss.SSS');
		const requestUrl = new URL('base_url', path); // TSP_API_BASE_URL

		const response = this.httpService.get(requestUrl.toString(), {
			headers: this.getHeaders(),
			params: {
				dtLetzteAenderung: lastChangeDate,
			},
		});

		return response.data;
	}
}
