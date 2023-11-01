import { H5pError } from '@lumieducation/h5p-server';
import { HttpException } from '@nestjs/common';

export class H5PErrorMapper {
	public mapH5pError(error: H5pError) {
		return new HttpException(error.message, error.httpStatusCode);
	}
}
