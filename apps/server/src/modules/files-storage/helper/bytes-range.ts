import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { IGetFileResponse } from '../interface';

export function setBytesRangeHeader(httpResponse: Response, fileResponse: IGetFileResponse, bytesRange?: string) {
	// If bytes range has been defined, set Accept-Ranges and Content-Range HTTP headers
	// in a response and also set 206 Partial Content HTTP status code to inform the caller
	// about the partial data stream. Otherwise, just set a 200 OK HTTP status code.
	if (bytesRange) {
		httpResponse.set({
			'Accept-Ranges': 'bytes',
			'Content-Range': fileResponse.contentRange,
		});

		httpResponse.status(HttpStatus.PARTIAL_CONTENT);
	} else {
		httpResponse.status(HttpStatus.OK);
	}
}
