import { HttpService } from '@nestjs/axios';
import { EntityId, ICurrentUser } from '@shared/domain';
import { firstValueFrom, Observable } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { URL, URLSearchParams } from 'url';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { ICalendarEvent } from './calendar-event.interface';

@Injectable()
export class CalendarService {
	private readonly baseURL: string;

	private readonly timeoutMs: number;

	constructor(private readonly httpService: HttpService) {
		this.baseURL = Configuration.get('HOST') as string;
		this.timeoutMs = Configuration.get('REQUEST_OPTION__TIMEOUT_MS') as number;
	}

	async findEvent(userId: EntityId, eventId: EntityId): Promise<ICalendarEvent> {
		const params = new URLSearchParams();
		params.append('event-id', eventId);

		return firstValueFrom(
			this.get('/events', params, {
				headers: {
					Authorization: userId,
					Accept: 'Application/json',
				},
				timeout: this.timeoutMs,
			})
		)
			.then((resp: AxiosResponse<ICalendarEvent>) => resp.data)
			.catch((error) => {
				throw new InternalServerErrorException(error);
			});
	}

	private get(
		path: string,
		queryParams: URLSearchParams = new URLSearchParams(),
		config: AxiosRequestConfig = {}
	): Observable<AxiosResponse<ICalendarEvent>> {
		const url: URL = new URL(this.baseURL);
		url.pathname = `/calendar${path}`;
		url.search = queryParams.toString();
		return this.httpService.get(url.toString(), config);
	}
}
