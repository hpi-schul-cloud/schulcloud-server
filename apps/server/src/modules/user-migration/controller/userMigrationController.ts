import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { PageContentQueryParams } from './dto/page-type.query.param';
import { PageContentResponse } from './dto/page-content.response';
import { MigrationUc } from '../uc/migration.uc';

@ApiTags('UserMigration')
@Controller('user-migration')
export class UserMigrationController {
	constructor(private readonly uc: MigrationUc) {}

	@Get('page-content')
	async getMigrationPageDetails(@Query() pageTypeQuery: PageContentQueryParams): Promise<PageContentResponse> {
		const response: PageContentResponse = await this.uc.getPageContent(
			pageTypeQuery.pageType,
			pageTypeQuery.sourceSystem,
			pageTypeQuery.targetSystem
		);
		return response;
	}
}
