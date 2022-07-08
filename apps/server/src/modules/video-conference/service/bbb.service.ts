import crypto from 'crypto';
import xml2json from '@hendt/xml2json';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { URL, URLSearchParams } from 'url';
import { firstValueFrom, Observable } from 'rxjs';
import { BBBCreateConfig } from '@src/modules/video-conference/config/bbb-create.config';
import { BBBJoinConfig } from '@src/modules/video-conference/config/bbb-join.config';
import { BBBEndConfig } from '@src/modules/video-conference/config/bbb-end.config';
import { BBBCreateBreakoutConfig } from '@src/modules/video-conference/config/bbb-create-breakout.config';
import { BbbMeetingInfoConfig } from '@src/modules/video-conference/config/bbb-meeting-info.config';
import {
	BBBBaseResponse,
	BBBCreateResponse,
	BBBJoinResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoconferenceRepo } from '@shared/repo/videoconference';
import { VideoConference } from '@shared/domain/entity/video-conference.entity';

@Injectable()
export class BBBService {
	private readonly baseURL: string;

	private readonly salt: string;

	constructor(private readonly httpService: HttpService) {
		this.baseURL = Configuration.get('VIDEOCONFERENCE_HOST') as string;
		this.salt = Configuration.get('VIDEOCONFERENCE_SALT') as string;
	}

	create(config: BBBCreateConfig | BBBCreateBreakoutConfig): Promise<BBBResponse<BBBCreateResponse>> {
		return firstValueFrom(this.get('create', this.toParams(config)))
			.then((resp: AxiosResponse<string>) => xml2json(resp.data) as BBBResponse<BBBCreateResponse>)
			.catch(() => {
				throw new InternalServerErrorException('Failed to create BBB room');
			});
	}

	join(config: BBBJoinConfig): Promise<BBBResponse<BBBJoinResponse>> {
		return firstValueFrom(this.get('join', this.toParams(config)))
			.then((resp: AxiosResponse<string>) => xml2json(resp.data) as BBBResponse<BBBJoinResponse>)
			.catch(() => {
				throw new InternalServerErrorException('Failed to join BBB room');
			});
	}

	end(config: BBBEndConfig): Promise<BBBResponse<BBBBaseResponse>> {
		return firstValueFrom(this.get('end', this.toParams(config)))
			.then((resp: AxiosResponse<string>) => xml2json(resp.data) as BBBResponse<BBBBaseResponse>)
			.catch(() => {
				throw new InternalServerErrorException('Failed to end BBB room');
			});
	}

	getMeetingInfo(config: BbbMeetingInfoConfig): Promise<BBBResponse<BBBMeetingInfoResponse>> {
		return firstValueFrom(this.get('getMeetingInfo', this.toParams(config)))
			.then((resp: AxiosResponse<string>) => xml2json(resp.data) as BBBResponse<BBBMeetingInfoResponse>)
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

	private get(callName: string, queryParams: URLSearchParams): Observable<AxiosResponse> {
		const checksum: string = this.generateChecksum(callName, queryParams);
		queryParams.append('checksum', checksum);

		const url: URL = new URL(this.baseURL);
		url.pathname = `/api/${callName}`;
		url.search = queryParams.toString();

		return this.httpService.get(url.toString());
	}
}
