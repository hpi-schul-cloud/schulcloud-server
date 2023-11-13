import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { IsString, IsUrl } from 'class-validator';

export class MetaTagExtractorResponse {
	constructor({ url, title, description, imageUrl }: MetaTagExtractorResponse) {
		this.url = url;
		this.title = title;
		this.description = description;
		this.imageUrl = imageUrl;
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
}
