import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

@Injectable()
export class TldrawWsService {
	constructor(private httpService: HttpService) {}

	async authorizeConnection(drawingName: string, token: string) {
		await firstValueFrom(
			this.httpService.get(`${Configuration.get('API_HOST') as string}/v3/elements/${drawingName}/permission`, {
				headers: {
					Accept: 'Application/json',
					Authorization: `Bearer ${token}`,
				},
			})
		);
	}
}
