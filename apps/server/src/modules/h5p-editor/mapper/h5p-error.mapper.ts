import { H5pError } from '@lumieducation/h5p-server';
import { HttpException, InternalServerErrorException } from '@nestjs/common';

export class H5PErrorMapper {
	public mapH5pError(error: H5pError) {
		if (error instanceof H5pError) {
			return new HttpException(error.message, error.httpStatusCode);
		}
		return new InternalServerErrorException({ error });
	}
}
