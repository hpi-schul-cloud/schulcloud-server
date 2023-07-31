import { IContentMetadata } from '@lumieducation/h5p-server';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString, Matches } from 'class-validator';

export class GetH5PContentParams {
	@ApiPropertyOptional()
	@Matches('([a-z]+-[a-z]+)')
	@IsString()
	@SanitizeHtml()
	@IsOptional()
	language?: string;

	@ApiProperty()
	@IsMongoId()
	contentId!: string;
}

export class GetH5PEditorParams {
	@ApiProperty()
	@IsMongoId()
	contentId!: string;
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
	@ApiProperty()
	@IsNotEmpty()
	@IsObject()
	params!: {
		// Todo
		params: unknown;
		metadata: IContentMetadata;
	};

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	library!: string;
}
