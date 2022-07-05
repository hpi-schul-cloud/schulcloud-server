import crypto from 'crypto';
import xml2json from '@hendt/xml2json';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { URLSearchParams } from 'url';
import { firstValueFrom, Observable } from 'rxjs';
import { BBBCreateConfig } from '@src/modules/video-conference/config/bbb-create.config';
import { BBBJoinConfig } from '@src/modules/video-conference/config/bbb-join.config';
import { BBBEndConfig } from '@src/modules/video-conference/config/bbb-end.config';
import { BBBCreateBreakoutConfig } from '@src/modules/video-conference/config/bbb-create-breakout.config';

interface BBBBaseResponse {
	response: {
		returncode: string;
		messageKey: string;
		message: string;
	};
}

interface BBBCreateResponse extends BBBBaseResponse {
	response: {
		returncode: string;
		messageKey: string;
		message: string;

		meetingID: string;
		internalMeetingID: string;
		parentMeetingID: string;
	};
}

interface BBBJoinResponse extends BBBBaseResponse {
	response: {
		returncode: string;
		messageKey: string;
		message: string;

		meeting_id: string;
		user_id: string;
		auth_token: string;
		session_token: string;
		url: string;
	};
}

interface BBBEndResponse extends BBBBaseResponse {
	response: {
		returncode: string;
		messageKey: string;
		message: string;
	};
}

@Injectable()
export class VideoConferenceService {
	readonly baseURL: string;

	private readonly salt: string;

	constructor(private readonly httpService: HttpService) {
		this.baseURL = Configuration.get('VIDEOCONFERENCE_HOST') as string;
		this.salt = Configuration.get('VIDEOCONFERENCE_SALT') as string;
	}

	create(config: BBBCreateConfig | BBBCreateBreakoutConfig): Promise<BBBCreateResponse> {
		return firstValueFrom(this.get('create', this.toParams(config)))
			.then((resp: AxiosResponse<string>) => xml2json(resp.data) as BBBCreateResponse)
			.catch(() => {
				throw new HttpException('Failed to create BBB room', HttpStatus.INTERNAL_SERVER_ERROR);
			});
	}

	join(config: BBBJoinConfig): Promise<BBBJoinResponse> {
		return firstValueFrom(this.get('join', this.toParams(config)))
			.then((resp: AxiosResponse<string>) => xml2json(resp.data) as BBBJoinResponse)
			.catch(() => {
				throw new HttpException('Failed to join BBB room', HttpStatus.INTERNAL_SERVER_ERROR);
			});
	}

	end(config: BBBEndConfig): Promise<BBBEndResponse> {
		return firstValueFrom(this.get('end', this.toParams(config)))
			.then((resp: AxiosResponse<string>) => xml2json(resp.data) as BBBEndResponse)
			.catch(() => {
				throw new HttpException('Failed to end BBB room', HttpStatus.INTERNAL_SERVER_ERROR);
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

		const response: Observable<AxiosResponse> = this.httpService.get(
			`${this.baseURL}/api/${callName}?${queryParams.toString()}`
		);
		return response;
	}
}
