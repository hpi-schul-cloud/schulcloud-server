import { IContentMetadata } from '@lumieducation/h5p-server';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GetH5PContentParams {
	@ApiProperty()
	@Matches('([a-z]+-[a-z]+)')
	@IsString()
	@IsNotEmpty()
	language!: string;

	@ApiProperty()
	@Matches('([A-Z0-9a-z]+)')
	@IsString()
	@IsNotEmpty()
	contentId!: string;
}

export class PostH5PContentParams {
	@ApiProperty()
	@Matches('([A-Z0-9a-z]+)')
	@IsString()
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
	@IsNotEmpty()
	mainLibraryUbername!: string;
}
