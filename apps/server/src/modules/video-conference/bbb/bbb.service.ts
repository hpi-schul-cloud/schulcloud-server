import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ErrorUtils } from '@src/core/error/utils';
import { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { firstValueFrom, Observable } from 'rxjs';
import { URL, URLSearchParams } from 'url';
import xml2json from '@hendt/xml2json/lib';
import { BbbSettings, IBbbSettings } from './bbb-settings.interface';
import { BBBBaseMeetingConfig, BBBCreateConfig, BBBJoinConfig } from './request';
import { BBBBaseResponse, BBBCreateResponse, BBBMeetingInfoResponse, BBBResponse, BBBStatus } from './response';

@Injectable()
export class BBBService {
	constructor(
		@Inject(BbbSettings) private readonly bbbSettings: IBbbSettings,
		private readonly httpService: HttpService
	) {}

	protected get baseUrl(): string {
		return this.bbbSettings.host;
	}

	protected get salt(): string {
		return this.bbbSettings.salt;
	}

	protected get presentationUrl(): string {
		return this.bbbSettings.presentationUrl;
	}

	/** Note no guard, or type check. Should be private. */
	public xml2object<T>(xml: string): T {
		const json = xml2json(xml) as T;

		return json;
	}

	private checkIfResponseSucces(
		bbbResp: BBBResponse<BBBCreateResponse> | BBBResponse<BBBBaseResponse> | BBBResponse<BBBMeetingInfoResponse>
	): void {
		if (bbbResp.response.returncode !== BBBStatus.SUCCESS) {
			throw new InternalServerErrorException(`${bbbResp.response.messageKey}: ${bbbResp.response.message}`);
		}
	}

	/**
	 * Creates a new BBB Meeting. The create call is idempotent: you can call it multiple times with the same parameters without side effects.
	 * @throws {InternalServerErrorException}
	 */
	public create(config: BBBCreateConfig): Promise<BBBResponse<BBBCreateResponse>> {
		const url: string = this.getUrl('create', this.toParams(config));
		const conf = { headers: { 'Content-Type': 'application/xml' } };
		const data = this.getBbbRequestConfig(this.presentationUrl);
		const observable: Observable<AxiosResponse<string>> = this.httpService.post(url, data, conf);

		return firstValueFrom(observable)
			.then((resp: AxiosResponse<string>) => {
				const bbbResp = this.xml2object<BBBResponse<BBBCreateResponse>>(resp.data);
				this.checkIfResponseSucces(bbbResp);

				return bbbResp;
			})
			.catch((error) => {
				throw new InternalServerErrorException(null, ErrorUtils.createHttpExceptionOptions(error, 'BBBService:create'));
			});
	}

	// it should be a private method
	private getBbbRequestConfig(presentationUrl: string): string {
		if (presentationUrl === '') return '';
		return `<?xml version='1.0' encoding='UTF-8'?><modules><module name='presentation'><document url='${presentationUrl}' /></module></modules>`;
	}

	/**
	 * Creates a join link to a BBB Meeting.
	 * @param {BBBJoinConfig} config
	 * @returns {Promise<string>} The join url
	 * @throws {InternalServerErrorException}
	 */
	public async join(config: BBBJoinConfig): Promise<string> {
		await this.getMeetingInfo(new BBBBaseMeetingConfig({ meetingID: config.meetingID }));

		return this.getUrl('join', this.toParams(config));
	}

	/**
	 * Ends a BBB Meeting.
	 * @param {BBBBaseMeetingConfig} config
	 * @returns {BBBResponse<BBBBaseResponse>}
	 * @throws {InternalServerErrorException}
	 */
	public end(config: BBBBaseMeetingConfig): Promise<BBBResponse<BBBBaseResponse>> {
		const url: string = this.getUrl('end', this.toParams(config));
		const observable: Observable<AxiosResponse<string>> = this.httpService.get(url);

		return firstValueFrom(observable)
			.then((resp: AxiosResponse<string>) => {
				const bbbResp = this.xml2object<BBBResponse<BBBBaseResponse>>(resp.data);
				this.checkIfResponseSucces(bbbResp);

				return bbbResp;
			})
			.catch((error) => {
				throw new InternalServerErrorException(null, ErrorUtils.createHttpExceptionOptions(error, 'BBBService:end'));
			});
	}

	/**
	 * Returns information about a BBB Meeting.
	 * @throws {InternalServerErrorException}
	 */
	public getMeetingInfo(config: BBBBaseMeetingConfig): Promise<BBBResponse<BBBMeetingInfoResponse>> {
		const url: string = this.getUrl('getMeetingInfo', this.toParams(config));
		const observable: Observable<AxiosResponse<string>> = this.httpService.get(url);

		return firstValueFrom(observable)
			.then((resp: AxiosResponse<string>) => {
				const bbbResp = this.xml2object<BBBResponse<BBBMeetingInfoResponse>>(resp.data);
				this.checkIfResponseSucces(bbbResp);

				return bbbResp;
			})
			.catch((error) => {
				throw new InternalServerErrorException(
					null,
					ErrorUtils.createHttpExceptionOptions(error, 'BBBService:getMeetingInfo')
				);
			});
	}

	/**
	 * Returns a SHA1 encoded checksum for the input parameters.
	 * should be private
	 */
	protected generateChecksum(callName: string, queryParams: URLSearchParams): string {
		const queryString: string = queryParams.toString();
		const sha = crypto.createHash('sha1');
		sha.update(callName + queryString + this.salt);
		const checksum: string = sha.digest('hex');

		return checksum;
	}

	/**
	 * Extracts fields from a javascript object and builds a URLSearchParams object from it.
	 * should be private
	 */
	protected toParams(object: BBBCreateConfig | BBBBaseMeetingConfig): URLSearchParams {
		const params: URLSearchParams = new URLSearchParams();
		Object.keys(object).forEach((key) => {
			if (key) {
				params.append(key, String(object[key]));
			}
		});

		return params;
	}

	/**
	 * Builds the url for BBB.
	 * should be private
	 */
	protected getUrl(callName: string, queryParams: URLSearchParams): string {
		const checksum: string = this.generateChecksum(callName, queryParams);
		queryParams.append('checksum', checksum);

		const url: URL = new URL(this.baseUrl);
		url.pathname = `/bigbluebutton/api/${callName}`;
		url.search = queryParams.toString();

		return url.toString();
	}
}
