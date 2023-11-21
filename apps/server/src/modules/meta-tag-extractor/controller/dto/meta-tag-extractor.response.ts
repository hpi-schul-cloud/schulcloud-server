import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { IsString, IsUrl } from 'class-validator';
import { MetaDataEntityType } from '../../types';

export class MetaTagExtractorResponse {
	constructor({ url, title, description, imageUrl, type, parentTitle, parentType }: MetaTagExtractorResponse) {
		this.url = url;
		this.title = title;
		this.description = description;
		this.imageUrl = imageUrl;
		this.type = type;
		this.parentTitle = parentTitle;
		this.parentType = parentType;
	}

	@ApiProperty()
	@IsUrl()
	url!: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	title?: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	description?: string;

	@ApiProperty()
	@IsString()
	imageUrl?: string;

	@ApiProperty()
	@IsString()
	type: MetaDataEntityType;

	@ApiProperty()
	@DecodeHtmlEntities()
	parentTitle?: string;

	@ApiProperty()
	@IsString()
	parentType?: MetaDataEntityType;
}
