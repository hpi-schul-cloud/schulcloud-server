import { BadRequestException, Injectable, PipeTransform, ValidationPipe } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiProperty } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { IsArray, IsString, validate } from 'class-validator';

class LibrariesBodyParams {
	@ApiProperty()
	@IsArray()
	@IsString({ each: true })
	libraries!: string[];
}

class ContentBodyParams {
	@ApiProperty()
	@IsString()
	contentId!: string;

	@ApiProperty()
	@IsString()
	field!: string;
}

class LibraryParametersBodyParams {
	@ApiProperty()
	@IsString()
	libraryParameters!: string;
}

export type AjaxPostBodyParams = LibrariesBodyParams | ContentBodyParams | LibraryParametersBodyParams | undefined;

@Injectable()
export class AjaxPostBodyParamsTransformPipe implements PipeTransform {
	async transform(value: AjaxPostBodyParams) {
		if (value) {
			let transformed: Exclude<AjaxPostBodyParams, undefined>;

			if ('libraries' in value) {
				transformed = plainToClass(LibrariesBodyParams, value);
			} else if ('contentId' in value) {
				transformed = plainToClass(ContentBodyParams, value);
			} else if ('libraryParameters' in value) {
				transformed = plainToClass(LibraryParametersBodyParams, value);
			} else {
				return undefined;
			}

			const validationResult = await validate(transformed);
			if (validationResult.length > 0) {
				const validationPipe = new ValidationPipe();
				const exceptionFactory = validationPipe.createExceptionFactory();
				throw exceptionFactory(validationResult);
			}

			return transformed;
		}

		return undefined;
	}
}

export const AjaxPostBodyParamsFilesInterceptor = AnyFilesInterceptor({
	limits: { files: 2 },
	fileFilter(_req, file, callback) {
		if (file.fieldname === 'file' || file.fieldname === 'h5p') {
			callback(null, true);
		} else {
			callback(new BadRequestException('File not allowed'), false);
		}
	},
});
