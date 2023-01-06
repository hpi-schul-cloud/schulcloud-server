import { Injectable } from '@nestjs/common';
import { PageTypes } from '../controller/dto/page-type.query.param';
import { PageContentResponse } from '../controller/dto/page-content.response';
import { MigrationService } from '../service/migration.service';
import { Logger } from '../../../core/logger';

@Injectable()
export class MigrationUc {
	constructor(private readonly migrationService: MigrationService) {}

	async getPageContent(pageType: PageTypes, sourceSystem: string, targetSystem: string): Promise<PageContentResponse> {
		const response: PageContentResponse = new PageContentResponse({
			contentKey: 'content',
			proceedButtonKey: 'procKey',
			proceedButtonUrl: 'procUrl',
			cancelButtonKey: 'cancelKey',
			cancelButtonUrl: 'cancelUrl',
		});

		return response;
	}
}
