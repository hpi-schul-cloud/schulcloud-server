import { BiloOauthConfig } from './bilo-oauth-config.interface';

export interface BiloMediaSource {
	id: string;

	oauthConfig?: BiloOauthConfig;
}
