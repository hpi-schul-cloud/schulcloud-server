import { AxiosHeaderValue, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { BaseFactory } from './base.factory';

export type AxiosHeadersKeyValue = { [key: string]: AxiosHeaderValue };
type AxiosResponseProps<T> = {
	data: T;
	status: number;
	statusText: string;
	headers: AxiosHeadersKeyValue;
	config: InternalAxiosRequestConfig<unknown>;
};

class AxiosResponseImp<T> implements AxiosResponse {
	data: T;

	status: number;

	statusText: string;

	headers: AxiosHeaders;

	config: InternalAxiosRequestConfig<unknown>;

	constructor(props: AxiosResponseProps<T>) {
		this.data = props.data;
		this.status = props.status;
		this.statusText = props.statusText;
		this.headers = new AxiosHeaders(props.headers);
		this.config = props.config;
	}
}

export const axiosResponseFactory = BaseFactory.define<AxiosResponseImp<unknown>, AxiosResponseProps<unknown>>(
	AxiosResponseImp,
	() => {
		return {
			data: '',
			status: 200,
			statusText: '',
			headers: new AxiosHeaders(),
			config: { headers: new AxiosHeaders() },
		};
	}
);
