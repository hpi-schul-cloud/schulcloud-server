import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ErrorUtils } from '@src/core/error/utils';
import { ConfigService } from '@nestjs/config';
import { Importance } from './enum';
import { ComponentResponse, IncidentDto, IncidentsResponse, MessagesDto } from './dto';
import { MessageMapper } from '../controller/mapper';
import { ServerConfig } from '../../server';

@Injectable()
export class StatusAdapter {
	private readonly url: string;

	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService<ServerConfig, true>
	) {
		this.url = configService.get('ALERT_STATUS_URL');
	}

	public async getMessage(instance: string) {
		const rawData = await this.getIncidentsData(instance);
		const data = new MessagesDto([], false);

		if (rawData) {
			rawData.forEach((element) => {
				const message = MessageMapper.mapToMessage(element, this.url);
				data.messages.push(message);
			});
			data.success = true;
		} else {
			data.success = false;
		}

		return data;
	}

	private async getIncidentsData(instance: string) {
		try {
			return await this.getData(instance);
		} catch (err) {
			return null;
		}
	}

	private async getData(instance: string) {
		const instanceSpecific: IncidentDto[] = [];
		const noneSpecific: IncidentDto[] = [];
		const rawData = await this.getIncidents();
		const statusEnum = { fixed: 4, danger: 2 };

		const filteredData = rawData.data.filter((element) => element.status !== statusEnum.fixed);
		const promises = filteredData.map(async (element) => {
			const importance = await this.getImportance(instance, element.component_id);
			if (importance !== Importance.ALL_INSTANCES && importance !== Importance.INGORE) {
				instanceSpecific.push(element);
			} else if (importance !== Importance.INGORE) {
				noneSpecific.push(element);
			}
		});

		await Promise.all(promises);

		instanceSpecific.sort(this.compareIncidents);
		noneSpecific.sort(this.compareIncidents);

		return instanceSpecific.concat(noneSpecific);
	}

	private async getImportance(instance: string, componentId: number): Promise<Importance> {
		if (componentId !== 0) {
			return this.getImportanceForComponent(instance, componentId);
		}
		return Importance.ALL_INSTANCES;
	}

	private async getImportanceForComponent(instance: string, componentId: number): Promise<Importance> {
		try {
			const response = await this.getComponent(componentId);
			const instanceNumber = this.getInstanceNumber(instance);
			if (instanceNumber === response.data.group_id) {
				return Importance.CURRENT_INSTANCE;
			}
			return Importance.INGORE;
		} catch (err) {
			return Importance.INGORE;
		}
	}

	private async getComponent(componentId: number): Promise<ComponentResponse> {
		return firstValueFrom(this.httpService.get(`${this.url}/api/v1/components/${componentId}`))
			.then((response: AxiosResponse<ComponentResponse>) => response.data)
			.catch((error) => {
				throw new InternalServerErrorException(
					null,
					ErrorUtils.createHttpExceptionOptions(error, 'StatusAdapter:getComponent')
				);
			});
	}

	private async getIncidents(): Promise<IncidentsResponse> {
		return firstValueFrom(this.httpService.get(`${this.url}/api/v1/incidents`, { params: { sort: 'id' } }))
			.then((response: AxiosResponse<IncidentsResponse>) => response.data)
			.catch((error) => {
				throw new InternalServerErrorException(
					null,
					ErrorUtils.createHttpExceptionOptions(error, 'StatusAdapter:getIncidents')
				);
			});
	}

	private compareIncidents = (a: IncidentDto, b: IncidentDto) => {
		const dateA = new Date(a.updated_at);
		const dateB = new Date(b.updated_at);
		const createdAtA = new Date(a.created_at);
		const createdAtB = new Date(b.created_at);

		// sort by status; danger first
		if (a.status > b.status) return 1;
		if (b.status > a.status) return -1;
		// sort by newest
		if (dateA > dateB) return -1;
		if (dateB > dateA) return 1;
		if (createdAtA > createdAtB) return -1;
		if (createdAtB > createdAtA) return 1;

		return 0;
	};

	private getInstanceNumber(instance: string) {
		if (instance.toLowerCase() === 'default') {
			return 1;
		}

		if (instance.toLowerCase() === 'brb') {
			return 2;
		}

		if (instance.toLowerCase() === 'open') {
			return 3;
		}

		if (instance.toLowerCase() === 'n21') {
			return 6;
		}

		if (instance.toLowerCase() === 'thr') {
			return 7;
		}

		return 0;
	}
}
