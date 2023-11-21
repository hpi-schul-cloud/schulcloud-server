import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { firstValueFrom } from 'rxjs';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class DrawingElementAdapterService {
	constructor(private logger: LegacyLogger, private readonly httpService: HttpService) {
		this.logger.setContext(DrawingElementAdapterService.name);
	}

	async deleteDrawingBinData(docName: string): Promise<void> {
		await firstValueFrom(
			this.httpService.delete(`${Configuration.get('TLDRAW_URI') as string}/tldraw-document/${docName}`, {
				headers: {
					Accept: 'Application/json',
				},
			})
		);
	}
}
