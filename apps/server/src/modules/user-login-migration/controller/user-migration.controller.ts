import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PageContentMapper } from '../mapper';
import { PageContentDto } from '../service/dto';
import { UserLoginMigrationUc } from '../uc/user-login-migration.uc';
import { PageContentQueryParams, PageContentResponse } from './dto';

@ApiTags('UserMigration')
@Controller('user-migration')
/**
 * @Deprecated
 */
export class UserMigrationController {
	constructor(private readonly uc: UserLoginMigrationUc, private readonly pageContentMapper: PageContentMapper) {}

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
