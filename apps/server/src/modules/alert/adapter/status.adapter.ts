import { ErrorUtils } from '@core/error/utils';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ALERT_CONFIG, AlertConfig } from '../alert.config';
import { MessageMapper } from '../controller/mapper';
import { ComponentResponse, IncidentDto, IncidentsResponse, MessagesDto } from './dto';
import { Importance } from './enum';

@Injectable()
export class StatusAdapter {
	constructor(private readonly httpService: HttpService, @Inject(ALERT_CONFIG) private readonly config: AlertConfig) {}

	public async getMessage(instance: string): Promise<MessagesDto> {
		const rawData = await this.getIncidentsData(instance);
		const data = new MessagesDto([], false);

		if (rawData) {
			rawData.forEach((element) => {
				const message = MessageMapper.mapToMessage(element, this.config.alertStatusUrl);
				data.messages.push(message);
			});
			data.success = true;
		} else {
			data.success = false;
		}

		return data;
	}

	private async getIncidentsData(instance: string): Promise<IncidentDto[] | null> {
		try {
			return await this.getData(instance);
		} catch (err) {
			return null;
		}
	}

	private async getData(instance: string): Promise<IncidentDto[]> {
		const instanceSpecific: IncidentDto[] = [];
		const noneSpecific: IncidentDto[] = [];
		const rawData = await this.getIncidents();
		const statusEnum = { fixed: 4, danger: 2 };

		const mapByImportance: Record<Importance, (IncidentDto) => void> = {
			[Importance.INGORE]: () => {},
			[Importance.ALL_INSTANCES]: (element: IncidentDto) => noneSpecific.push(element),
			[Importance.CURRENT_INSTANCE]: (element: IncidentDto) => instanceSpecific.push(element),
		};

		const filteredData = rawData.data.filter((element) => element.status !== statusEnum.fixed);
		const promises = filteredData.map(async (element) => {
			const importance = await this.getImportance(instance, element.component_id);
			return mapByImportance[importance](element);
		});

		await Promise.all(promises);

		instanceSpecific.sort(this.compareIncidents);
		noneSpecific.sort(this.compareIncidents);

		return instanceSpecific.concat(noneSpecific);
	}

	private async getImportance(instance: string, componentId: number): Promise<Importance> {
		if (componentId !== 0) {
			const importance = await this.getImportanceForComponent(instance, componentId);
			return importance;
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
		try {
			const request = this.httpService.get<ComponentResponse>(
				`${this.config.alertStatusUrl}/api/v1/components/${componentId}`
			);

			const resp = await firstValueFrom(request);

			if (resp.status !== 200) {
				throw new Error(`invalid HTTP status code in a response from the server - ${resp.status} instead of 200`);
			}

			return resp.data;
		} catch (error) {
			throw new InternalServerErrorException(
				null,
				ErrorUtils.createHttpExceptionOptions(error, 'StatusAdapter:getComponent')
			);
		}
	}

	private async getIncidents(): Promise<IncidentsResponse> {
		try {
			const request = this.httpService.get<IncidentsResponse>(`${this.config.alertStatusUrl}/api/v1/incidents`, {
				params: { sort: 'id' },
			});

			const resp = await firstValueFrom(request);

			if (resp.status !== 200 && resp.status !== 202) {
				throw new Error(`invalid HTTP status code in a response from the server - ${resp.status} instead of 202`);
			}

			return resp.data;
		} catch (error) {
			throw new InternalServerErrorException(
				null,
				ErrorUtils.createHttpExceptionOptions(error, 'StatusAdapter:getIncidents')
			);
		}
	}

	private compareIncidents = (a: IncidentDto, b: IncidentDto): number => {
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

	private getInstanceNumber(instance: string): number {
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
