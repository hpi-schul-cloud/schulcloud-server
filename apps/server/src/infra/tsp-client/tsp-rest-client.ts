import { HttpService } from '@nestjs/axios';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';

export class TSPRestClient {
	// private readonly TSP_API_BASE_URL: string;
	// private readonly TSP_API_CLIENT_ID: string;
	// private readonly TSP_API_CLIENT_SECRET: string;
	// private readonly TSP_API_TOKEN_ENDPOINT: string;

	private lastToken!: string;

	private lastTokenExpires!: number;

	constructor(private readonly httpService: HttpService) {}

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
			apiClientSecret: 'secret', // TSP_API_CLIENT_SECRET
			iss: 'locahost', // process.env.SC_DOMAIN
			aud: 'base_url', // TSP_API_BASE_URL
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
