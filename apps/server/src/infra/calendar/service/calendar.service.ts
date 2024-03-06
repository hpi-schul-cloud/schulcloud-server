import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorUtils } from '@src/core/error/utils';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom, Observable } from 'rxjs';
import { URL, URLSearchParams } from 'url';
import { CalendarEventDto } from '../dto/calendar-event.dto';
import { CalendarEvent } from '../interface/calendar-event.interface';
import { CalendarMapper } from '../mapper/calendar.mapper';
import { Test } from '@nestjs/testing';
//import { DeletionService } from '@shared/domain/interface';
//import { UserDeletedEvent } from '@src/modules/deletion/event';
//import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';

@Injectable()
export class CalendarService {
	//implements DeletionService, IEventHandler<UserDeletedEvent> {
	private readonly baseURL: string;

	private readonly timeoutMs: number;

	constructor(
		private readonly httpService: HttpService,
		private readonly calendarMapper: CalendarMapper //private readonly eventBus: EventBus, //private readonly logger: LegacyLogger
	) {
		//this.logger.setContext(CalendarService.name);
		this.baseURL = Configuration.get('CALENDAR_URI') as string;
		this.timeoutMs = Configuration.get('REQUEST_OPTION__TIMEOUT_MS') as number;
	}

	// async handle({ deletionRequest }: UserDeletedEvent) {
	// 	const dataDeleted = await this.deleteUserData(deletionRequest.targetRefId);
	// 	await this.eventBus.publish(new DataDeletedEvent(deletionRequest, dataDeleted));
	// }

	async findEvent(userId: EntityId, eventId: EntityId): Promise<CalendarEventDto> {
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
			.then((resp: AxiosResponse<CalendarEvent>) => this.calendarMapper.mapToDto(resp.data))
			.catch((error) => {
				throw new InternalServerErrorException(
					null,
					ErrorUtils.createHttpExceptionOptions(error, 'CalendarService:findEvent')
				);
			});
	}

	async deleteEventsByScopeId(scopeId: EntityId): Promise<void> {
		const request = this.httpService.delete(`/scopes/${scopeId}`, {
			headers: {
				Authorization: scopeId,
				Accept: 'Application/json',
			},
			timeout: this.timeoutMs,
		});

		const resp = await firstValueFrom(request).catch((error) => {
			throw new InternalServerErrorException(
				null,
				ErrorUtils.createHttpExceptionOptions(error, 'CalendarService:findEvent')
			);
		});

		if (resp.status !== 204) {
			throw new Error(`invalid HTTP status code in a response from the server instead of 204`);
		}
	}

	private get(
		path: string,
		queryParams: URLSearchParams,
		config: AxiosRequestConfig
	): Observable<AxiosResponse<CalendarEvent>> {
		const url: URL = new URL(this.baseURL);
		url.pathname = path;
		url.search = queryParams.toString();
		return this.httpService.get(url.toString(), config);
	}
}
