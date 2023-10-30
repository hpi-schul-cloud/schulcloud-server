import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PageContentMapper } from '../mapper/page-content.mapper';
import { PageContentDto } from '../service/dto/page-content.dto';
import { UserLoginMigrationUc } from '../uc/user-login-migration.uc';
import { PageContentQueryParams } from './dto/request/page-type.query.param';
import { PageContentResponse } from './dto/response/page-content.response';

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
