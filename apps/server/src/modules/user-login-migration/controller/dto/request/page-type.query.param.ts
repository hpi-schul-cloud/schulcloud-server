import { IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageTypes } from '../../../interface/page-types.enum';

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
