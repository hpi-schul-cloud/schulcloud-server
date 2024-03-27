import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LegacyLogger } from '@src/core/logger';
import { AxiosRequestConfig } from 'axios';
import { createSign } from 'crypto';
import { lastValueFrom } from 'rxjs';
import { EduSharingConfig } from '../edu-sharing.config';

@Injectable()
export class EduSharingService {
	private readonly appId: string;

	private readonly baseUrl: string;

	private readonly privateKey: string;

	private readonly publicKey: string;

	/**
	 * Constructor
	 *
	 * @param string appId
	 * @param string baseUrl
	 * @param string privateKey
	 * @param ConfigService<EduSharingConfig, true> configService
	 * @param LegacyLogger logger
	 */
	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService<EduSharingConfig, true>,
		private readonly logger: LegacyLogger
	) {
		this.appId = this.configService.get('APP_ID');
		this.baseUrl = this.configService.get('DOMAIN');
		this.privateKey = this.configService.get('PRIVATE_KEY');
		this.publicKey = this.configService.get('PUBLIC_KEY');
		this.logger.setContext(EduSharingService.name);
	}

	getEduAppXMLData(): string {
		return this.generateEduAppXMLData(this.publicKey);
	}

	/**
	 * Function getTicketAuthenticationInfo
	 *
	 * Gets detailed information about a ticket
	 * Will throw an exception if the given ticket is not valid anymore
	 * @param string ticket
	 * The ticket, obtained by @getTicketForUser
	 * @return array
	 * Detailed information about the current session
	 * @throws Exception
	 * Thrown if the ticket is not valid anymore
	 */
	async getTicketAuthenticationInfo(ticket: string): Promise<any> {
		const headers = {
			Authorization: this.getRESTAuthenticationHeader(ticket),
			Accept: 'application/json',
			'Content-Type': 'application/json',
		};
		try {
			const response = await lastValueFrom(
				this.httpService.get(`${this.baseUrl}/rest/authentication/v1/validateSession`, { headers })
			);
			const data = response.data;
			if (data.statusCode !== 'OK') {
				throw new Error('The given ticket is not valid anymore');
			}
			return response;
		} catch (error) {
			this.logger.error(`No answer from repository. Possibly a timeout while trying to connect to ${this.baseUrl}`);
			throw error;
		}
	}

	/**
	 * Function getTicketForUser
	 *
	 * Fetches the edu-sharing ticket for a given username
	 * @param string username
	 * The username you want to generate a ticket for
	 * @param array|null additionalFields
	 * additional post fields to submit
	 * @return string
	 * The ticket, which you can use as an authentication header, see @getRESTAuthenticationHeader
	 * @throws AppAuthException
	 * @throws Exception
	 */
	async getTicketForUser(
		username: string,
		additionalFields?: { [key: string]: string | File } | undefined
	): Promise<string> {
		const options: AxiosRequestConfig = {
			method: 'POST',
			url: `${this.baseUrl}/rest/authentication/v1/appauth/${encodeURIComponent('admin')}`,
			headers: this.getSignatureHeaders('admin'),
			timeout: 5000,
		};
		console.log(options);
		if (additionalFields !== null) {
			options.data = additionalFields;
		}
		try {
			const observable = this.httpService.request(options);
			const response = await lastValueFrom(observable)
				.then((response) => {
					console.log('response', response);
				})
				.catch((error) => {
					console.log('message', error.response.data);
				});
			// const data = response.data;
			// const gotError = data.error !== undefined;
			// const responseOk = !gotError;
			// if (responseOk && (data.userId === username || data.userId.startsWith(username + '@'))) {
			// 	return data.ticket;
			// }
			// throw new Error(data.message || '');
			return 'hello world';
		} catch (error) {
			this.logger.error(`edu-sharing ticket could not be retrieved for ${username} from ${this.baseUrl}`, error);
			throw error;
		}
	}

	/**
	 * Function getRESTAuthenticationHeader
	 *
	 * Generates the header to use for a given ticket to authenticate with any edu-sharing api endpoint
	 * @param string ticket
	 * The ticket, obtained by @getTicketForUser
	 * @return string
	 */
	private getRESTAuthenticationHeader(ticket: string): string {
		return `Authorization: EDU-TICKET ${ticket}`;
	}

	/**
	 * Function getSignatureHeaders
	 *
	 * @param string signString
	 * @param string accept
	 * @param string contentType
	 * @return string[]
	 */
	private getSignatureHeaders(signString: string, accept = 'application/json', contentType = 'application/json') {
		const ts = new Date().getTime();
		const toSign = `${this.appId}${signString}${ts}`;
		const signature = this.sign(toSign);
		return {
			Accept: accept,
			'Content-Type': contentType,
			'X-Edu-App-Id': this.appId,
			'X-Edu-App-Signed': toSign,
			'X-Edu-App-Sig': signature,
			'X-Edu-App-Ts': ts,
		};
	}

	/**
	 * Function sign
	 *
	 * @param string toSign
	 * @return string
	 */
	private sign(data: string): string {
		const sign = createSign('RSA-SHA256');
		sign.update(data);
		return sign.sign(this.privateKey, 'base64');
	}

	/**
	 * Function generateEduAppXMLData
	 *
	 * Generates an edu-sharing compatible xml file for registering the application
	 * This is a very basic function and is only intended for demonstration or manual use. Data is not escaped!
	 */
	private generateEduAppXMLData(publicKey: string, type = 'LMS', publicIP = '*'): string {
		return (
			'<?xml version="1.0" encoding="UTF-8"?>\r\n' +
			'<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\r\n' +
			'<properties>\r\n' +
			`    <entry key="appid">${this.appId}</entry>\r\n` +
			`    <entry key="public_key">${publicKey}</entry>\r\n` +
			`    <entry key="type">${type}</entry>\r\n` +
			'    <entry key="domain"></entry>\r\n' +
			'    <!-- in case of wildcard host: Replace this, if possible, with the public ip from your service -->\r\n' +
			`    <entry key ="host">${publicIP}</entry>\r\n` +
			'    <!-- must be true -->\r\n' +
			'    <entry key="trustedclient">true</entry>\r\n' +
			'</properties>\r\n'
		);
	}
}
