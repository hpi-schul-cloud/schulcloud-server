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
	public async transform(value: AjaxPostBodyParams): Promise<unknown> {
		if (value === undefined) {
			return undefined;
		}
		if ('libraries' in value) {
			value = plainToClass(LibrariesBodyParams, value);
		} else if ('contentId' in value) {
			value = plainToClass(ContentBodyParams, value);
		} else if ('libraryParameters' in value) {
			value = plainToClass(LibraryParametersBodyParams, value);
		} else {
			return undefined;
		}

		const validationResult = await validate(value);
		if (validationResult.length > 0) {
			const validationPipe = new ValidationPipe();
			const exceptionFactory = validationPipe.createExceptionFactory();
			throw exceptionFactory(validationResult);
		}

		return value;
	}
}
