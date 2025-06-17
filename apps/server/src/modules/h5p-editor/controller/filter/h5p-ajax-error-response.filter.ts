import { DomainErrorHandler } from '@core/error';
import { AjaxErrorResponse, H5pError } from '@lumieducation/h5p-server';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class H5pAjaxErrorResponseFilter implements ExceptionFilter {
	constructor(private readonly domainErrorHandler: DomainErrorHandler) {}

	public catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		let status: number;
		let clientErrorCode = '';
		let message: string;
		let details: string;

		if (exception instanceof H5pError) {
			status = exception.httpStatusCode;
			clientErrorCode = exception.clientErrorId ?? '';
			message = this.mapErrorMessageFromH5pError(exception);
			details = exception.message;
		} else if (exception instanceof HttpException) {
			status = exception.getStatus();
			message = exception.name;
			details = exception.message;
		} else {
			status = 500;
			message = 'Internal Server Error';
			details = 'An unexpected error had occurred.';
		}

		this.domainErrorHandler.execHttpContext(exception, host.switchToHttp());

		const ajaxErrorResponse = new AjaxErrorResponse(clientErrorCode, status, message, details);

		response.status(status).json(ajaxErrorResponse);
	}

	private mapErrorMessageFromH5pError(error: H5pError): string {
		switch (error.errorId) {
			case 'install-missing-libraries':
				return 'Error - File contains one or more not supported libraries';
			default:
				return error.name;
		}
	}
}
