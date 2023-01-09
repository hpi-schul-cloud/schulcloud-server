import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { Logger } from '../../../core/logger';
import { PageContentQueryParams } from './dto/page-type.query.param';
import { PageContentResponse } from './dto/page-content.response';
import { MigrationUc } from '../uc/migration.uc';

@ApiTags('Migration')
@Controller('migration')
export class MigrationController {
	constructor(private readonly uc: MigrationUc) {}

	@Get('page-content')
	async getMigrationPageDetails(@Query() pageTypeQuery: PageContentQueryParams): Promise<PageContentResponse> {
		return this.uc.getPageContent(pageTypeQuery.pageType, pageTypeQuery.sourceSystem, pageTypeQuery.targetSystem);
	}
}
