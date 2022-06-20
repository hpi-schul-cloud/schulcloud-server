import { AxiosRequestConfig } from 'axios';
import { FileRequestInfo } from '../interfaces';

export class AxiosJWTOptionBuilder {
	static build(param: FileRequestInfo): AxiosRequestConfig {
		const options = { headers: { Authorization: `Bearer ${param.jwt}` } };

		return options;
	}
}
