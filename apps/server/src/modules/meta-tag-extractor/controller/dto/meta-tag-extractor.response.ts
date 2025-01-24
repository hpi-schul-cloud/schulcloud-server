import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { IsString, IsUrl } from 'class-validator';
import { MetaDataEntityType } from '../../types';

export class MetaTagExtractorResponse {
	constructor({
		url,
		title,
		description,
		originalImageUrl,
		imageUrl,
		type,
		parentTitle,
		parentType,
	}: MetaTagExtractorResponse) {
		this.url = url;
		this.title = title;
		this.description = description;
		this.imageUrl = imageUrl;
		this.originalImageUrl = originalImageUrl;
		this.type = type;
		this.parentTitle = parentTitle;
		this.parentType = parentType;
	}

	@ApiProperty()
	@IsUrl()
	public url!: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	public title?: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	public description?: string;

	@ApiProperty()
	@IsString()
	public originalImageUrl?: string;

	@ApiProperty()
	@IsString()
	public imageUrl?: string;

	@ApiProperty({ enum: MetaDataEntityType, enumName: 'MetaDataEntityType' })
	@IsString()
	public type: MetaDataEntityType;

	@ApiProperty()
	@DecodeHtmlEntities()
	public parentTitle?: string;

	@ApiProperty({ enum: MetaDataEntityType, enumName: 'MetaDataEntityType' })
	@IsString()
	public parentType?: MetaDataEntityType;
}
