import { IContentMetadata } from '@lumieducation/h5p-server';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { LanguageType } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { IsEnum, IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { H5PContentParentType } from '../../types';

export class GetH5PContentParams {
	@ApiPropertyOptional({ enum: LanguageType, enumName: 'LanguageType' })
	@IsEnum(LanguageType)
	@IsOptional()
	public language?: LanguageType;

	@ApiProperty()
	@IsMongoId()
	public contentId!: string;
}

export class GetH5PEditorParamsCreate {
	@ApiProperty({ enum: LanguageType, enumName: 'LanguageType' })
	@IsEnum(LanguageType)
	public language!: LanguageType;
}

export class GetH5PEditorParams {
	@ApiProperty()
	@IsMongoId()
	public contentId!: string;

	@ApiProperty({ enum: LanguageType, enumName: 'LanguageType' })
	@IsEnum(LanguageType)
	public language!: LanguageType;
}

export class SaveH5PEditorParams {
	@ApiProperty()
	@IsMongoId()
	public contentId!: string;
}

export class PostH5PContentParams {
	@ApiProperty()
	@IsMongoId()
	public contentId!: string;

	@ApiProperty()
	@IsNotEmpty()
	public params!: unknown;

	@ApiProperty()
	@IsNotEmpty()
	public metadata!: IContentMetadata;

	@ApiProperty()
	@IsString()
	@SanitizeHtml()
	@IsNotEmpty()
	public mainLibraryUbername!: string;
}

export class PostH5PContentCreateParams {
	@ApiProperty({ enum: H5PContentParentType, enumName: 'H5PContentParentType' })
	@IsEnum(H5PContentParentType)
	public parentType!: H5PContentParentType;

	@ApiProperty()
	@IsMongoId()
	public parentId!: EntityId;

	@ApiProperty()
	@IsNotEmpty()
	@IsObject()
	public params!: {
		params: unknown;
		metadata: IContentMetadata;
	};

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	public library!: string;
}
