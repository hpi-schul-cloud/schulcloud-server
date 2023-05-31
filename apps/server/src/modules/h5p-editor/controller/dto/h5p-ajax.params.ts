import { BadRequestException, Injectable, PipeTransform, ValidationPipe } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { Allow, IsArray, IsNotEmpty, IsOptional, IsString, validate } from 'class-validator';

export class GetH5PAjaxParams {
	@IsString()
	@IsNotEmpty()
	action!: string;

	@IsString()
	@IsOptional()
	machineName?: string;

	@IsString()
	@IsOptional()
	majorVersion?: string;

	@IsString()
	@IsOptional()
	minorVersion?: string;

	@IsString()
	@IsOptional()
	language?: string;
}

export class FileParams {
	@ApiProperty({ type: 'string', format: 'binary' })
	@Allow()
	@IsOptional()
	file?: string;

	@ApiProperty({ type: 'string', format: 'binary' })
	@Allow()
	@IsOptional()
	h5p?: string;
}

export class PostH5PAjaxParams {
	@ApiProperty()
	@IsArray()
	@IsOptional()
	libraries?: string[];

	@ApiProperty()
	@IsOptional()
	contentId?: string;

	@ApiProperty()
	@IsOptional()
	field?: string;

	@ApiProperty()
	@IsOptional()
	libraryParameters?: string;
}

export class PostH5PAjaxQueryParams {
	@IsString()
	@IsNotEmpty()
	action!: string;

	@IsString()
	@IsOptional()
	machineName?: string;

	@IsString()
	@IsOptional()
	majorVersion?: string;

	@IsString()
	@IsOptional()
	minorVersion?: string;

	@IsString()
	@IsOptional()
	language?: string;

	@IsString()
	@IsOptional()
	id?: string;
}

class H5PAjaxPostBodyLibraries {
	@ApiProperty()
	@IsArray()
	@IsString({ each: true })
	libraries!: string[];
}

class H5PAjaxPostBodyContent {
	@ApiProperty()
	@IsString()
	contentId!: string;

	@ApiProperty()
	@IsString()
	field!: string;
}

class H5PAjaxPostBodyLibraryParameters {
	@ApiProperty()
	@IsString()
	libraryParameters!: string;
}

export type H5PAjaxPostBody =
	| H5PAjaxPostBodyLibraries
	| H5PAjaxPostBodyContent
	| H5PAjaxPostBodyLibraryParameters
	| undefined;

@Injectable()
export class H5PAjaxPostBodyTransformPipe implements PipeTransform {
	async transform(value: H5PAjaxPostBody): Promise<H5PAjaxPostBody> {
		if (value) {
			let transformed: H5PAjaxPostBodyLibraries | H5PAjaxPostBodyContent | H5PAjaxPostBodyLibraryParameters;

			if ('libraries' in value) {
				transformed = plainToClass(H5PAjaxPostBodyLibraries, value);
			} else if ('contentId' in value) {
				transformed = plainToClass(H5PAjaxPostBodyContent, value);
			} else if ('libraryParameters' in value) {
				transformed = plainToClass(H5PAjaxPostBodyLibraryParameters, value);
			} else {
				return undefined;
			}

			const validation = await validate(transformed);
			if (validation.length > 0) {
				const validationPipe = new ValidationPipe();
				const exceptionFactory = validationPipe.createExceptionFactory();
				throw exceptionFactory(validation);
			}

			return transformed;
		}

		return undefined;
	}
}
