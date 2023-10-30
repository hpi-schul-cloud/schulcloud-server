import { ApiProperty } from '@nestjs/swagger';
import { PageTypes } from '@src/modules/user-login-migration/interface/page-types.enum';
import { IsEnum, IsMongoId } from 'class-validator';

export class PageContentQueryParams {
	@ApiProperty({ description: 'The Type of Page that is displayed', type: PageTypes })
	@IsEnum(PageTypes)
	pageType!: PageTypes;

	@ApiProperty({ description: 'The Source System' })
	@IsMongoId()
	sourceSystem!: string;

	@ApiProperty({ description: 'The Target System' })
	@IsMongoId()
	targetSystem!: string;
}
