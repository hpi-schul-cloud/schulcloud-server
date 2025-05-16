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
import { AxiosError } from 'axios';
import moment, { Moment } from 'moment';

@Injectable()
export class TspFetchService {
	constructor(private readonly tspClientFactory: TspClientFactory) {}

	public async fetchTspSchools(system: System, daysToFetch: number): Promise<RobjExportSchule[]> {
		try {
			const lastChangeDate = this.formatChangeDate(daysToFetch);
			const client = this.createClient(system);

			const response = await client.exportSchuleList(lastChangeDate);
			const { data } = response;

			return data;
		} catch (e) {
			this.handleFetchError(e, 'TSP_FETCH_SCHOOLS_ERROR');
		}
	}

	public async fetchTspTeachers(system: System, daysToFetch: number): Promise<RobjExportLehrer[]> {
		try {
			const lastChangeDate = this.formatChangeDate(daysToFetch);
			const client = this.createClient(system);

			const response = await client.exportLehrerList(lastChangeDate);
			const { data } = response;

			return data;
		} catch (e) {
			this.handleFetchError(e, 'TSP_FETCH_TEACHERS_ERROR');
		}
	}

	public async fetchTspStudents(system: System, daysToFetch: number): Promise<RobjExportSchueler[]> {
		try {
			const lastChangeDate = this.formatChangeDate(daysToFetch);
			const client = this.createClient(system);

			const response = await client.exportSchuelerList(lastChangeDate);
			const { data } = response;

			return data;
		} catch (e) {
			this.handleFetchError(e, 'TSP_FETCH_STUDENTS_ERROR');
		}
	}

	public async fetchTspClasses(system: System, daysToFetch: number): Promise<RobjExportKlasse[]> {
		try {
			const lastChangeDate = this.formatChangeDate(daysToFetch);
			const client = this.createClient(system);

			const response = await client.exportKlasseList(lastChangeDate);
			const { data } = response;

			return data;
		} catch (e) {
			this.handleFetchError(e, 'TSP_FETCH_CLASSES_ERROR');
		}
	}

	private handleFetchError(e: unknown, type: string): never {
		if (e instanceof AxiosError) {
			throw new AxiosErrorLoggable(e, type);
		} else {
			throw e;
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
