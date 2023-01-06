import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { Logger } from '../../../core/logger';
import { PageTypeQueryParams } from './dto/page-type.query.param';
import { PageContentResponse } from './dto/page-content.response';
import { MigrationUc } from '../uc/migration.uc';

@ApiTags('Migration')
@Controller('migration')
export class MigrationController {
	constructor(private uc: MigrationUc, private logger: Logger) {
		this.logger.setContext(MigrationController.name);
	}

	@Get('page-content')
	async getMigrationPageDetails(@Query() pageTypeQuery: PageTypeQueryParams): Promise<PageContentResponse> {
		return this.uc.getPageContent(pageTypeQuery.pageType, pageTypeQuery.sourceSystem, pageTypeQuery.targetSystem);
	}
}
