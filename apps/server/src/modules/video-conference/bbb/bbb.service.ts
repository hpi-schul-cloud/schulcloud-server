import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConverterUtil } from '@shared/common/utils';
import { ErrorUtils } from '@src/core/error/utils';
import { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { firstValueFrom, Observable } from 'rxjs';
import { URL, URLSearchParams } from 'url';
import { VideoConferenceConfig } from '../video-conference-config';
import { BbbConfig } from './bbb-config';
import { BBBBaseMeetingConfig, BBBCreateConfig, BBBJoinConfig } from './request';
import { BBBBaseResponse, BBBCreateResponse, BBBMeetingInfoResponse, BBBResponse, BBBStatus } from './response';

@Injectable()
export class BBBService {
	constructor(
		private readonly configService: ConfigService<BbbConfig & VideoConferenceConfig, true>,
		private readonly httpService: HttpService,
		private readonly converterUtil: ConverterUtil
	) {}

	protected get baseUrl(): string {
		return this.configService.get('HOST');
	}

	protected get salt(): string {
		return this.configService.get('VIDEOCONFERENCE_SALT');
	}

	protected get presentationUrl(): string {
		return this.configService.get('VIDEOCONFERENCE_DEFAULT_PRESENTATION');
	}

	/**
	 * Creates a new BBB Meeting. The create call is idempotent: you can call it multiple times with the same parameters without side effects.
	 * @param {BBBCreateConfig} config
	 * @returns {Promise<BBBResponse<BBBCreateResponse>>}
	 * @throws {InternalServerErrorException}
	 */
	create(config: BBBCreateConfig): Promise<BBBResponse<BBBCreateResponse>> {
		const url: string = this.getUrl('create', this.toParams(config));
		const conf = { headers: { 'Content-Type': 'application/xml' } };
		const data = this.getBbbRequestConfig(this.presentationUrl);
		const observable: Observable<AxiosResponse<string>> = this.httpService.post(url, data, conf);

		return firstValueFrom(observable)
			.then((resp: AxiosResponse<string>) => {
				const bbbResp = this.converterUtil.xml2object<BBBResponse<BBBCreateResponse> | BBBResponse<BBBBaseResponse>>(
					resp.data
				);
				if (bbbResp.response.returncode !== BBBStatus.SUCCESS) {
					throw new InternalServerErrorException(`${bbbResp.response.messageKey}: ${bbbResp.response.message}`);
				}
				return bbbResp as BBBResponse<BBBCreateResponse>;
			})
			.catch((error) => {
				throw new InternalServerErrorException(null, ErrorUtils.createHttpExceptionOptions(error, 'BBBService:create'));
			});
	}

	// it should be a private method
	getBbbRequestConfig(presentationUrl: string): string {
		if (presentationUrl === '') return '';
		return `<?xml version='1.0' encoding='UTF-8'?><modules><module name='presentation'><document url='${presentationUrl}' /></module></modules>`;
	}

	/**
	 * Creates a join link to a BBB Meeting.
	 * @param {BBBJoinConfig} config
	 * @returns {Promise<string>} The join url
	 * @throws {InternalServerErrorException}
	 */
	async join(config: BBBJoinConfig): Promise<string> {
		await this.getMeetingInfo(new BBBBaseMeetingConfig({ meetingID: config.meetingID }));

		return this.getUrl('join', this.toParams(config));
	}

	/**
	 * Ends a BBB Meeting.
	 * @param {BBBBaseMeetingConfig} config
	 * @returns {BBBResponse<BBBBaseResponse>}
	 * @throws {InternalServerErrorException}
	 */
	end(config: BBBBaseMeetingConfig): Promise<BBBResponse<BBBBaseResponse>> {
		const url: string = this.getUrl('end', this.toParams(config));
		const observable: Observable<AxiosResponse<string>> = this.httpService.get(url);

		return firstValueFrom(observable)
			.then((resp: AxiosResponse<string>) => {
				const bbbResp = this.converterUtil.xml2object<BBBResponse<BBBBaseResponse>>(resp.data);
				if (bbbResp.response.returncode !== BBBStatus.SUCCESS) {
					throw new InternalServerErrorException(`${bbbResp.response.messageKey}: ${bbbResp.response.message}`);
				}
				return bbbResp;
			})
			.catch((error) => {
				throw new InternalServerErrorException(null, ErrorUtils.createHttpExceptionOptions(error, 'BBBService:end'));
			});
	}

	/**
	 * Returns information about a BBB Meeting.
	 * @param {BBBBaseMeetingConfig} config
	 * @returns {Promise<string>}
	 * @throws {InternalServerErrorException}
	 */
	getMeetingInfo(config: BBBBaseMeetingConfig): Promise<BBBResponse<BBBMeetingInfoResponse>> {
		const url: string = this.getUrl('getMeetingInfo', this.toParams(config));
		const observable: Observable<AxiosResponse<string>> = this.httpService.get(url);

		return firstValueFrom(observable)
			.then((resp: AxiosResponse<string>) => {
				const bbbResp = this.converterUtil.xml2object<
					BBBResponse<BBBMeetingInfoResponse> | BBBResponse<BBBBaseResponse>
				>(resp.data);
				if (bbbResp.response.returncode !== BBBStatus.SUCCESS) {
					throw new InternalServerErrorException(`${bbbResp.response.messageKey}: ${bbbResp.response.message}`);
				}
				return bbbResp as BBBResponse<BBBMeetingInfoResponse>;
			})
			.catch((error) => {
				throw new InternalServerErrorException(
					null,
					ErrorUtils.createHttpExceptionOptions(error, 'BBBService:getMeetingInfo')
				);
			});
	}

	// should be private
	/**
	 * Returns a SHA1 encoded checksum for the input parameters.
	 * @param {string} callName
	 * @param {URLSearchParams} queryParams
	 * @returns {string}
	 */
	protected generateChecksum(callName: string, queryParams: URLSearchParams): string {
		const queryString: string = queryParams.toString();
		const sha = crypto.createHash('sha1');
		sha.update(callName + queryString + this.salt);
		const checksum: string = sha.digest('hex');
		return checksum;
	}

	// should be private
	/**
	 * Extracts fields from a javascript object and builds a URLSearchParams object from it.
	 * @param {object} object
	 * @returns {URLSearchParams}
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

	// should be private
	/**
	 * Builds the url for BBB.
	 * @param callName Name of the BBB api function.
	 * @param queryParams Parameters for the endpoint.
	 * @returns {string} A callable url.
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
