import { IContentMetadata } from '@lumieducation/h5p-server';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { IsNotEmpty, IsObject, IsOptional, IsString, Matches } from 'class-validator';

export class GetH5PContentParams {
	@ApiPropertyOptional()
	@Matches('([a-z]+-[a-z]+)')
	@IsString()
	@SanitizeHtml()
	language?: string;

	@ApiProperty()
	@Matches('([A-Z0-9a-z]+)')
	@IsString()
	@SanitizeHtml()
	@IsNotEmpty()
	contentId!: string;
}

export class GetH5PEditorParams {
	@ApiPropertyOptional()
	@Matches('([a-z]+-[a-z]+)')
	@IsString()
	language?: string;

	@ApiPropertyOptional()
	@Matches('([A-Z0-9a-z]+)')
	@IsString()
	@SanitizeHtml()
	contentId?: string;
}

export class SaveH5PEditorParams {
	@ApiProperty()
	@Matches('([A-Z0-9a-z]+)')
	@IsString()
	@SanitizeHtml()
	@IsNotEmpty()
	contentId!: string;
}

export class PostH5PContentParams {
	@ApiProperty()
	@Matches('([A-Z0-9a-z]+)')
	@IsString()
	@SanitizeHtml()
	@IsNotEmpty()
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
	@IsObject()
	@IsOptional()
	metadata!: IContentMetadata;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	library!: string;
}
