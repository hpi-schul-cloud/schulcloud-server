import { CookiesDto } from '@src/modules/oauth/service/dto/cookies.dto';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

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
