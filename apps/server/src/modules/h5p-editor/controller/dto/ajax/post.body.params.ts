import { BadRequestException, Injectable, PipeTransform, ValidationPipe } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiProperty } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { IsArray, IsMongoId, IsOptional, IsString, validate } from 'class-validator';

class LibrariesBodyParams {
	@ApiProperty()
	@IsArray()
	@IsString({ each: true })
	libraries!: string[];
}

class ContentBodyParams {
	@ApiProperty()
	@IsMongoId()
	contentId!: string;

	@ApiProperty()
	@IsString()
	@IsOptional()
	field!: string;
}

class LibraryParametersBodyParams {
	@ApiProperty()
	@IsString()
	libraryParameters!: string;
}

export type AjaxPostBodyParams = LibrariesBodyParams | ContentBodyParams | LibraryParametersBodyParams | undefined;

/**
 * This transform pipe allows nest to validate the incoming request.
 * Since H5P does sent bodies with different shapes, this custom ValidationPipe makes sure the different cases are correctly validated.
 */
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

/**
 * H5P may or may not send files with the ajax request.
 * Since these files may be sent in two different fields, we cannot use Nest's default file interceptor (Only supports one field)
 * This interceptor is a specialization of the AnyFilesInterceptor that only accepts files with the two known fieldnames
 */
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
