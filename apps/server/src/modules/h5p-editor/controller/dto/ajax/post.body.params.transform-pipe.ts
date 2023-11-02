import { Injectable, PipeTransform, ValidationPipe } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import {
	AjaxPostBodyParams,
	LibrariesBodyParams,
	ContentBodyParams,
	LibraryParametersBodyParams,
} from './post.body.params';

/**
 * This transform pipe allows nest to validate the incoming request.
 * Since H5P does sent bodies with different shapes, this custom ValidationPipe makes sure the different cases are correctly validated.
 */

@Injectable()
export class AjaxPostBodyParamsTransformPipe implements PipeTransform {
	async transform(value: AjaxPostBodyParams): Promise<unknown> {
		console.log('value BEFORE IF', value);
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
			console.log('Transformed BEFORE validation', transformed);
			const validationResult = await validate(transformed);
			if (validationResult.length > 0) {
				const validationPipe = new ValidationPipe();
				const exceptionFactory = validationPipe.createExceptionFactory();
				throw exceptionFactory(validationResult);
			}
			console.log('Transformed BEFORE return', transformed);
			return transformed;
		}

		return undefined;
	}
}
