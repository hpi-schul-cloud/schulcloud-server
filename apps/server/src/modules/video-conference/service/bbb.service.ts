import crypto from 'crypto';
import xml2json from '@hendt/xml2json';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { URL, URLSearchParams } from 'url';
import { firstValueFrom } from 'rxjs';
import { BBBCreateConfig } from '@src/modules/video-conference/config/bbb-create.config';
import { BBBJoinConfig } from '@src/modules/video-conference/config/bbb-join.config';
import { BBBEndConfig } from '@src/modules/video-conference/config/bbb-end.config';
import { BBBCreateBreakoutConfig } from '@src/modules/video-conference/config/bbb-create-breakout.config';
import { BBBMeetingInfoConfig } from '@src/modules/video-conference/config/bbb-meeting-info.config';
import {
	BBBBaseResponse,
	BBBCreateResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceStatus } from '@src/modules/video-conference/interface/vc-status.enum';
import { Logger } from '@src/core/logger';

@Injectable()
export class BBBService {
	private readonly baseURL: string;

	private readonly salt: string;

	constructor(private readonly httpService: HttpService, private readonly logger: Logger) {
		this.baseURL = Configuration.get('VIDEOCONFERENCE_HOST') as string;
		this.salt = Configuration.get('VIDEOCONFERENCE_SALT') as string;
	}

	create(config: BBBCreateConfig | BBBCreateBreakoutConfig): Promise<BBBResponse<BBBCreateResponse>> {
		return firstValueFrom(this.httpService.get(this.getUrl('create', this.toParams(config))))
			.then((resp: AxiosResponse<string>) => {
				const bbbResp = xml2json(resp.data) as BBBResponse<BBBCreateResponse> | BBBResponse<BBBBaseResponse>;
				if (bbbResp.response.returncode !== VideoConferenceStatus.SUCCESS) {
					throw new InternalServerErrorException(bbbResp.response.messageKey, bbbResp.response.message);
				}
				return bbbResp as BBBResponse<BBBCreateResponse>;
			})
			.catch(() => {
				throw new InternalServerErrorException('Failed to create BBB room');
			});
	}

	async join(config: BBBJoinConfig): Promise<string> {
		await this.getMeetingInfo(new BBBMeetingInfoConfig({ meetingID: config.meetingID }));

		return this.getUrl('join', this.toParams(config));
	}

	end(config: BBBEndConfig): Promise<BBBResponse<BBBBaseResponse>> {
		return firstValueFrom(this.httpService.get(this.getUrl('end', this.toParams(config))))
			.then((resp: AxiosResponse<string>) => {
				const bbbResp = xml2json(resp.data) as BBBResponse<BBBBaseResponse>;
				if (bbbResp.response.returncode !== VideoConferenceStatus.SUCCESS) {
					throw new InternalServerErrorException(bbbResp.response.messageKey, bbbResp.response.message);
				}
				return bbbResp;
			})
			.catch(() => {
				throw new InternalServerErrorException('Failed to end BBB room');
			});
	}

	getMeetingInfo(config: BBBMeetingInfoConfig): Promise<BBBResponse<BBBMeetingInfoResponse>> {
		return firstValueFrom(this.httpService.get(this.getUrl('getMeetingInfo', this.toParams(config))))
			.then((resp: AxiosResponse<string>) => {
				const bbbResp = xml2json(resp.data) as BBBResponse<BBBMeetingInfoResponse> | BBBResponse<BBBBaseResponse>;
				if (bbbResp.response.returncode !== VideoConferenceStatus.SUCCESS) {
					throw new InternalServerErrorException(bbbResp.response.messageKey, bbbResp.response.message);
				}
				return bbbResp as BBBResponse<BBBMeetingInfoResponse>;
			})
			.catch(() => {
				throw new InternalServerErrorException('Failed to fetch BBB room info');
			});
	}

	private generateChecksum(callName: string, queryParams: URLSearchParams): string {
		const queryString: string = queryParams.toString();
		const sha = crypto.createHash('sha1');
		sha.update(callName + queryString + this.salt);
		const checksum: string = sha.digest('hex');
		return checksum;
	}

	private toParams(object: object): URLSearchParams {
		const params: URLSearchParams = new URLSearchParams();
		Object.keys(object).forEach((key) => {
			if (key) {
				params.append(key, String(object[key]));
			}
		});
		return params;
	}

	private getUrl(callName: string, queryParams: URLSearchParams): string {
		const checksum: string = this.generateChecksum(callName, queryParams);
		queryParams.append('checksum', checksum);

		const url: URL = new URL(this.baseURL);
		url.pathname = `/bigbluebutton/api/${callName}`;
		url.search = queryParams.toString();

		return url.toString();
	}
}
