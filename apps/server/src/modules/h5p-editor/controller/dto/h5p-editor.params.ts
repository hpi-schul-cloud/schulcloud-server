import { IContentMetadata } from '@lumieducation/h5p-server';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';

import { LanguageType } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { IsEnum, IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { H5PContentParentType } from '../../entity';

export class GetH5PContentParams {
	@ApiProperty({ enum: LanguageType, enumName: 'LanguageType' })
	@IsEnum(LanguageType)
	@IsOptional()
	language?: LanguageType;

	@ApiProperty()
	@IsMongoId()
	contentId!: string;
}

export class GetH5PEditorParamsCreate {
	@ApiProperty({ enum: LanguageType, enumName: 'LanguageType' })
	@IsEnum(LanguageType)
	language!: LanguageType;
}

export class GetH5PEditorParams {
	@ApiProperty()
	@IsMongoId()
	contentId!: string;

	@ApiProperty({ enum: LanguageType, enumName: 'LanguageType' })
	@IsEnum(LanguageType)
	language!: LanguageType;
}

export class SaveH5PEditorParams {
	@ApiProperty()
	@IsMongoId()
	contentId!: string;
}

export class PostH5PContentParams {
	@ApiProperty()
	@IsMongoId()
	contentId!: string;

	@ApiProperty()
	@IsNotEmpty()
	params!: unknown;

	@ApiProperty()
	@IsNotEmpty()
	metadata!: IContentMetadata;

	@ApiProperty()
	@IsString()
	@SanitizeHtml()
	@IsNotEmpty()
	mainLibraryUbername!: string;
}

export class PostH5PContentCreateParams {
	@ApiProperty({ enum: H5PContentParentType, enumName: 'H5PContentParentType' })
	@IsEnum(H5PContentParentType)
	parentType!: H5PContentParentType;

	@ApiProperty()
	@IsMongoId()
	parentId!: EntityId;

	@ApiProperty()
	@IsNotEmpty()
	@IsObject()
	params!: {
		params: unknown;
		metadata: IContentMetadata;
	};

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	library!: string;
}
