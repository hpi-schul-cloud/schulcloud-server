import { AxiosRequestConfig } from 'axios';
import { FileRequestInfo } from '../interfaces';

export class AxiosOptionBuilder {
	static build(param: FileRequestInfo, timeout: number): AxiosRequestConfig {
		const options = { headers: { Authorization: `Bearer ${param.jwt}`, timeout } };

		return options;
	}
}
