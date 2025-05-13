import { DomainErrorHandler } from '@core/error';
import { AxiosErrorLoggable } from '@core/error/loggable';
import {
	ExportApiInterface,
	RobjExportKlasse,
	RobjExportLehrer,
	RobjExportSchueler,
	RobjExportSchule,
	TspClientFactory,
} from '@infra/tsp-client';
import { OauthConfigMissingLoggableException } from '@modules/oauth/loggable';
import { System } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import moment, { Moment } from 'moment';

@Injectable()
export class TspFetchService {
	constructor(
		private readonly tspClientFactory: TspClientFactory,
		private readonly domainErrorHandler: DomainErrorHandler
	) {}

	public fetchTspSchools(system: System, daysToFetch: number): Promise<RobjExportSchule[]> {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const schools = this.fetchTsp(system, (client) => client.exportSchuleList(lastChangeDate));

		return schools;
	}

	public fetchTspTeachers(system: System, daysToFetch: number): Promise<RobjExportLehrer[]> {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const teachers = this.fetchTsp(system, (client) => client.exportLehrerList(lastChangeDate));

		return teachers;
	}

	public fetchTspStudents(system: System, daysToFetch: number): Promise<RobjExportSchueler[]> {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const students = this.fetchTsp(system, (client) => client.exportSchuelerList(lastChangeDate));

		return students;
	}

	public fetchTspClasses(system: System, daysToFetch: number): Promise<RobjExportKlasse[]> {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const classes = this.fetchTsp(system, (client) => client.exportKlasseList(lastChangeDate));

		return classes;
	}

	private async fetchTsp<T>(
		system: System,
		fetchFunction: (client: ExportApiInterface) => Promise<AxiosResponse<T>>
	): Promise<T> {
		try {
			const client = this.createClient(system);

			const response = await fetchFunction(client);
			const { data } = response;

			return data;
		} catch (e) {
			if (e instanceof AxiosError) {
				throw new AxiosErrorLoggable(e, 'TSP_FETCH_ERROR');
			} else {
				throw e;
			}
		}
	}

	private formatChangeDate(daysToFetch: number): string {
		let lastChange: Moment;
		if (daysToFetch === -1) {
			lastChange = moment(0);
		} else {
			lastChange = moment().subtract(daysToFetch, 'days').subtract(1, 'hours');
		}
		return lastChange.format('YYYY-MM-DD HH:mm:ss.SSS');
	}

	private createClient(system: System): ExportApiInterface {
		if (!system.oauthConfig) {
			throw new OauthConfigMissingLoggableException(system.id);
		}

		const client = this.tspClientFactory.createExportClient({
			clientId: system.oauthConfig.clientId,
			clientSecret: system.oauthConfig.clientSecret,
			tokenEndpoint: system.oauthConfig.tokenEndpoint,
		});

		return client;
	}
}
