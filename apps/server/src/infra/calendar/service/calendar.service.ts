import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ErrorUtils } from '@src/core/error/utils';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom, Observable } from 'rxjs';
import { URL, URLSearchParams } from 'url';
import { Logger } from '@src/core/logger';
import {
	DataDeletionDomainOperationLoggable,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
} from '@modules/deletion';
import { EntityId } from '@shared/domain/types';
import { CalendarEventDto } from '../dto/calendar-event.dto';
import { CalendarEvent } from '../interface/calendar-event.interface';
import { CalendarMapper } from '../mapper/calendar.mapper';
import { CalendarEventId } from '../interface/calendar-event-id.interface';

@Injectable()
export class CalendarService implements DeletionService {
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

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting data from Calendar Service',
				DomainName.CALENDAR,
				userId,
				StatusModel.PENDING
			)
		);

		const eventIds = await this.getAllEvents(userId);

		await this.deleteEventsByScopeId(userId);

		const result = DomainDeletionReportBuilder.build(DomainName.CALENDAR, [
			DomainOperationReportBuilder.build(OperationType.DELETE, eventIds.length, eventIds),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed user data from Calendar Service',
				DomainName.CALENDAR,
				userId,
				StatusModel.FINISHED,
				0,
				eventIds.length
			)
		);

		return result;
	}

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

	async getAllEvents(userId: EntityId): Promise<string[]> {
		const params = new URLSearchParams();

		return firstValueFrom(
			this.getRequest('/events', params, {
				headers: {
					Authorization: userId,
					Accept: 'Application/json',
				},
				timeout: this.timeoutMs,
			})
		)
			.then((resp: AxiosResponse<CalendarEventId>) => this.calendarMapper.mapEventsToId(resp.data))
			.catch((error) => {
				throw new InternalServerErrorException(
					null,
					ErrorUtils.createHttpExceptionOptions(error, 'CalendarService:getAllEvents')
				);
			});
	}

	async deleteEventsByScopeId(scopeId: EntityId): Promise<void> {
		const request = this.delete(`/scopes/${scopeId}`, {
			headers: {
				Authorization: scopeId,
				Accept: 'Application/json',
			},
			timeout: this.timeoutMs,
		});

		const resp = await firstValueFrom(request).catch((error) => {
			throw new InternalServerErrorException(
				null,
				ErrorUtils.createHttpExceptionOptions(error, 'CalendarService:deleteEventsByScopeId')
			);
		});

		if (resp.status !== 204) {
			throw new Error(`invalid HTTP status code = ${resp.status} in a response from the server instead of 204`);
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

	private getRequest(
		path: string,
		queryParams: URLSearchParams,
		config: AxiosRequestConfig
	): Observable<AxiosResponse<CalendarEventId>> {
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
