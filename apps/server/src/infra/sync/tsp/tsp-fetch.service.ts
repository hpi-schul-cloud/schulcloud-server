import { Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import moment from 'moment';
import { System } from '@modules/system';
import { OauthConfigMissingLoggableException } from '@modules/oauth/loggable';
import { Logger } from '@src/core/logger';
import { ExportApiInterface, TspClientFactory } from '../../tsp-client';
import { AxiosErrorLoggable, ErrorLoggable } from '../../../core/error/loggable';

@Injectable()
export class TspFetchService {
	constructor(private readonly tspClientFactory: TspClientFactory, private readonly logger: Logger) {
		this.logger.setContext(TspFetchService.name);
	}

	public async fetchTspSchools(system: System, daysToFetch: number) {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const schools = await this.fetchTsp(system, (client) => client.exportSchuleList(lastChangeDate), []);

		return schools;
	}

	public async fetchTspTeachers(system: System, daysToFetch: number) {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const teachers = await this.fetchTsp(system, (client) => client.exportLehrerList(lastChangeDate), []);

		return teachers;
	}

	public async fetchTspStudents(system: System, daysToFetch: number) {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const students = await this.fetchTsp(system, (client) => client.exportSchuelerList(lastChangeDate), []);

		return students;
	}

	public async fetchTspClasses(system: System, daysToFetch: number) {
		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const classes = await this.fetchTsp(system, (client) => client.exportKlasseList(lastChangeDate), []);

		return classes;
	}

	public async fetchTspTeacherMigrations(system: System) {
		const migrations = this.fetchTsp(system, (client) => client.exportLehrerListMigration(), []);

		return migrations;
	}

	public async fetchTspStudentMigrations(system: System) {
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

	private createClient(system: System) {
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
