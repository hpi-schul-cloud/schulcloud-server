import { Injectable } from '@nestjs/common';
import { PageTypes } from '../controller/dto/page-type.query.param';
import { PageContentResponse } from '../controller/dto/page-content.response';
import { MigrationService } from '../service/migration.service';
import { PageContentDto } from '../service/dto/page-content.dto';
import { PageContentMapper } from '../mapper/page-content.mapper';

@Injectable()
export class MigrationUc {
	constructor(
		private readonly migrationService: MigrationService,
		private readonly responseMapper: PageContentMapper
	) {}

	async getPageContent(pageType: PageTypes, sourceSystem: string, targetSystem: string): Promise<PageContentResponse> {
		const content: PageContentDto = await this.migrationService.getPageContent(pageType, sourceSystem, targetSystem);

		const response: PageContentResponse = this.responseMapper.mapDtoToResponse(content);

		return response;
	}
}
