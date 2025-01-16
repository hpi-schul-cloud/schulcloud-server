import { AxiosErrorLoggable, ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import {
	ExportApiInterface,
	RobjExportKlasse,
	RobjExportLehrer,
	RobjExportLehrerMigration,
	RobjExportSchueler,
	RobjExportSchuelerMigration,
	RobjExportSchule,
	TspClientFactory,
} from '@infra/tsp-client';
import { OauthConfigMissingLoggableException } from '@modules/oauth/loggable';
import { System } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import moment from 'moment';

@Injectable()
export class TspFetchService {
	constructor(private readonly tspClientFactory: TspClientFactory, private readonly logger: Logger) {
		this.logger.setContext(TspFetchService.name);
	}

	public fetchTspSchools(system: System, daysToFetch: number): Promise<RobjExportSchule[]> {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const schools = this.fetchTsp(system, (client) => client.exportSchuleList(lastChangeDate), []);

		return schools;
	}

	public fetchTspTeachers(system: System, daysToFetch: number): Promise<RobjExportLehrer[]> {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const teachers = this.fetchTsp(system, (client) => client.exportLehrerList(lastChangeDate), []);

		return teachers;
	}

	public fetchTspStudents(system: System, daysToFetch: number): Promise<RobjExportSchueler[]> {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const students = this.fetchTsp(system, (client) => client.exportSchuelerList(lastChangeDate), []);

		return students;
	}

	public fetchTspClasses(system: System, daysToFetch: number): Promise<RobjExportKlasse[]> {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const classes = this.fetchTsp(system, (client) => client.exportKlasseList(lastChangeDate), []);

		return classes;
	}

	public fetchTspTeacherMigrations(system: System): Promise<RobjExportLehrerMigration[]> {
		const migrations = this.fetchTsp(system, (client) => client.exportLehrerListMigration(), []);

		return migrations;
	}

	public fetchTspStudentMigrations(system: System): Promise<RobjExportSchuelerMigration[]> {
		const migrations = this.fetchTsp(system, (client) => client.exportSchuelerListMigration(), []);

		return migrations;
	}

	private async fetchTsp<T>(
		system: System,
		fetch: (client: ExportApiInterface) => Promise<AxiosResponse<T>>,
		defaultValue: T
	): Promise<T> {
		const client = this.createClient(system);
		try {
			const response = await fetch(client);
			const { data } = response;

			return data;
		} catch (e) {
			if (e instanceof AxiosError) {
				this.logger.warning(new AxiosErrorLoggable(e, 'TSP_FETCH_ERROR'));
			} else {
				this.logger.warning(new ErrorLoggable(e));
			}
		}
		return defaultValue;
	}

	private formatChangeDate(daysToFetch: number): string {
		return moment(new Date()).subtract(daysToFetch, 'days').subtract(1, 'hours').format('YYYY-MM-DD HH:mm:ss.SSS');
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
