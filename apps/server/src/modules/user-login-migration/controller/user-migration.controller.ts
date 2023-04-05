import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { PageContentQueryParams, PageContentResponse } from './dto';
import { MigrationUc } from '../uc/migration.uc';
import { PageContentDto } from '../service/dto/page-content.dto';
import { PageContentMapper } from '../mapper/page-content.mapper';

@ApiTags('UserMigration')
@Controller('user-migration')
/**
 * @Deprecated
 */
export class UserMigrationController {
	constructor(private readonly uc: MigrationUc, private readonly pageContentMapper: PageContentMapper) {}

	@Get('page-content')
	async getMigrationPageDetails(@Query() pageTypeQuery: PageContentQueryParams): Promise<PageContentResponse> {
		const content: PageContentDto = await this.uc.getPageContent(
			pageTypeQuery.pageType,
			pageTypeQuery.sourceSystem,
			pageTypeQuery.targetSystem
		);

		const response: PageContentResponse = this.pageContentMapper.mapDtoToResponse(content);
		return response;
	}
}
