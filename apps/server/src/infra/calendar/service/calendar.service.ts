import { ErrorUtils } from '@core/error/utils';
import { Logger } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom, Observable } from 'rxjs';
import { URL, URLSearchParams } from 'url';
import { CalendarEventDto } from '../dto/calendar-event.dto';
import { CalendarEventId } from '../interface/calendar-event-id.interface';
import { CalendarEvent } from '../interface/calendar-event.interface';
import { CalendarMapper } from '../mapper/calendar.mapper';

@Injectable()
export class CalendarService {
	private readonly baseURL: string;

	private readonly timeoutMs: number;

	constructor(
		private readonly httpService: HttpService,
		private readonly calendarMapper: CalendarMapper,
		private readonly logger: Logger
	) {
		this.logger.setContext(CalendarService.name);
		this.baseURL = Configuration.get('CALENDAR_URI') as string;
		this.timeoutMs = Configuration.get('REQUEST_OPTION__TIMEOUT_MS') as number;
	}

	public async findEvent(userId: EntityId, eventId: EntityId): Promise<CalendarEventDto> {
		const params = new URLSearchParams();
		params.append('event-id', eventId);
		try {
			const resp = await firstValueFrom(
				this.get<CalendarEvent>('/events', params, {
					headers: {
						Authorization: userId,
						Accept: 'Application/json',
					},
					timeout: this.timeoutMs,
				})
			);
			return this.calendarMapper.mapToDto(resp.data);
		} catch (error) {
			throw new InternalServerErrorException(
				null,
				ErrorUtils.createHttpExceptionOptions(error, 'CalendarService:findEvent')
			);
		}
	}

	public async getAllEvents(userId: EntityId, scopeId?: EntityId): Promise<string[]> {
		const params = new URLSearchParams();
		if (scopeId) {
			params.append('scope-id', scopeId);
		}
		try {
			const resp = await firstValueFrom(
				this.get<CalendarEventId>('/events', params, {
					headers: {
						Authorization: userId,
						Accept: 'Application/json',
					},
					timeout: this.timeoutMs,
				})
			);
			return this.calendarMapper.mapEventsToId(resp.data);
		} catch (error) {
			throw new InternalServerErrorException(
				null,
				ErrorUtils.createHttpExceptionOptions(error, 'CalendarService:getAllEvents')
			);
		}
	}

	public async deleteEventsByScopeId(scopeId: EntityId): Promise<void> {
		try {
			const request = this.delete(`/scopes/${scopeId}`, {
				headers: {
					Authorization: scopeId,
					Accept: 'Application/json',
				},
				timeout: this.timeoutMs,
			});

			const resp = await firstValueFrom(request);

			if (resp.status !== 204) {
				throw new Error(`invalid HTTP status code = ${resp.status} in a response from the server instead of 204`);
			}
		} catch (err) {
			throw new InternalServerErrorException(
				'CalendarService:deleteEventsByScopeId',
				ErrorUtils.createHttpExceptionOptions(err)
			);
		}
	}

	private get<T>(path: string, queryParams: URLSearchParams, config: AxiosRequestConfig): Observable<AxiosResponse<T>> {
		const url: URL = new URL(this.baseURL);
		url.pathname = path;
		url.search = queryParams.toString();
		return this.httpService.get(url.toString(), config);
	}

	private delete(path: string, config: AxiosRequestConfig): Observable<AxiosResponse<void>> {
		const url: URL = new URL(this.baseURL);
		url.pathname = path;
		return this.httpService.delete(url.toString(), config);
	}
}
