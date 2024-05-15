import { HttpStatus } from '@nestjs/common';
import { axiosResponseFactory } from '@shared/testing/factory';
import { AxiosError, AxiosHeaders } from 'axios';
import { Factory } from 'fishery';

class AxiosErrorFactory extends Factory<AxiosError> {
	withError(error: unknown): this {
		return this.params({
			response: axiosResponseFactory.build({ status: HttpStatus.BAD_REQUEST, data: error }),
		});
	}
}

export const axiosErrorFactory = AxiosErrorFactory.define(() => {
	return {
		status: HttpStatus.BAD_REQUEST,
		config: { headers: new AxiosHeaders() },
		isAxiosError: true,
		code: HttpStatus.BAD_REQUEST.toString(),
		message: 'Bad Request',
		name: 'BadRequest',
		response: axiosResponseFactory.build({ status: HttpStatus.BAD_REQUEST }),
		stack: 'mockStack',
		toJSON: () => {
			return { someJson: 'someJson' };
		},
	};
});
