import { HttpStatus } from '@nestjs/common';
import { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { DeepPartial } from 'fishery';
import { axiosResponseFactory } from './axios-response.factory';

import { BaseFactory } from './base.factory';

type AxiosErrorProps<T> = {
	status: number;
	statusText: string;
	headers: AxiosHeaders;
	config: InternalAxiosRequestConfig<unknown>;
	isAxiosError: boolean;
	code: string;
	message: string;
	name: string;
	response: AxiosResponse<unknown, T>;
	stack: string;
};

class AxiosErrorImp<T> implements AxiosError {
	status: number;

	statusText: string;

	headers: AxiosHeaders;

	config: InternalAxiosRequestConfig<unknown>;

	code: string;

	isAxiosError: boolean;

	message: string;

	name: string;

	response: AxiosResponse<unknown, T>;

	stack: string;

	constructor(props: AxiosErrorProps<T>) {
		this.status = props.status;
		this.statusText = props.statusText;
		this.headers = new AxiosHeaders(props.headers);
		this.config = props.config;
		this.code = props.code;
		this.isAxiosError = props.isAxiosError;
		this.message = props.message;
		this.name = props.name;
		this.response = props.response;
		this.stack = props.stack;
	}

	toJSON(): object {
		return {};
	}
}

export class AxiosErrorFactory extends BaseFactory<AxiosErrorImp<unknown>, AxiosErrorProps<unknown>> {
	withError(error: Error): this {
		const params: DeepPartial<AxiosErrorProps<unknown>> = {
			response: axiosResponseFactory.build({ status: HttpStatus.BAD_REQUEST, data: error }),
		};

		return this.params(params);
	}
}

export const axiosErrorFactory = AxiosErrorFactory.define(AxiosErrorImp, () => {
	return {
		status: HttpStatus.BAD_REQUEST,
		statusText: 'Bad Request',
		headers: new AxiosHeaders(),
		config: { headers: new AxiosHeaders() },
		isAxiosError: true,
		code: HttpStatus.BAD_REQUEST.toString(),
		message: 'Bad Request',
		name: 'BadRequest',
		response: axiosResponseFactory.build({ status: HttpStatus.BAD_REQUEST }),
		stack: 'mockStack',
	};
});
