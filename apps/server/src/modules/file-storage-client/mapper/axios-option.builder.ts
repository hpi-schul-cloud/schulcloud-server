import { AxiosRequestConfig } from 'axios';
import { FileRequestInfo, FileRequestOptions } from '../interfaces';

export class AxiosJWTOptionBuilder {
	static build(param: FileRequestInfo): AxiosRequestConfig<FileRequestOptions> {
		const options = { headers: { Authorization: `Bearer ${param.jwt}` } };

		return options;
	}
}
