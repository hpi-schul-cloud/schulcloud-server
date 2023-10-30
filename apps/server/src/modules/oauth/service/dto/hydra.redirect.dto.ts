import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CookiesDto } from './cookies.dto';

export class HydraRedirectDto {
	constructor(props: HydraRedirectDto) {
		this.currentRedirect = props.currentRedirect;
		this.referer = props.referer;
		this.cookies = props.cookies;
		this.response = props.response;
		this.axiosConfig = props.axiosConfig;
	}

	currentRedirect: number;

	referer: string;

	cookies: CookiesDto;

	response: AxiosResponse;

	axiosConfig: AxiosRequestConfig;
}
