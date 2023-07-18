import { AxiosRequestConfig, AxiosResponseHeaders } from 'axios';

export type RequestOptions = {
	hostname: string;
	port: string;
	path: string;
	timeout: number;
	method: string;
	headers: Record<string, unknown>;
};

export type DataToSend = {
	room: string;
	data: Map<
		string,
		{
			type: string;
			content: unknown;
		}
	> | null;
};

export type TldrawAxiosResponse = {
	data: undefined;
	status: number;
	statusText: string;
	headers: AxiosResponseHeaders;
	config: AxiosRequestConfig<undefined>;
	request: undefined;
};
