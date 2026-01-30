import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class LibrariesBodyParams {
	@ApiProperty()
	@IsArray()
	@IsString({ each: true })
	libraries!: string[];
}

export class ContentBodyParams {
	@ApiProperty()
	contentId!: string;

	@ApiProperty()
	@IsString()
	@IsOptional()
	field!: string;
}

export class LibraryParametersBodyParams {
	@ApiProperty()
	@IsString()
	libraryParameters!: string;
}

export type AjaxPostBodyParams = LibrariesBodyParams | ContentBodyParams | LibraryParametersBodyParams | undefined;
