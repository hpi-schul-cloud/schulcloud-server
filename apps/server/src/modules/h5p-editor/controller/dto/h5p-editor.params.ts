import { IContentMetadata } from '@lumieducation/h5p-server';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString, Matches } from 'class-validator';

export class GetH5PContentParams {
	@ApiProperty()
	@Matches('([a-z]+-[a-z]+)')
	@IsString()
	@IsOptional()
	language?: string;

	@ApiProperty()
	@IsMongoId()
	@IsOptional()
	contentId?: string;
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
