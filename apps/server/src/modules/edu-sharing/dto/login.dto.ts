import { LtiSessionDto } from './lti-session.dto';
import { RemoteAuthDescriptionDto } from './remote-auth-description.dto';

export interface LoginDto {
	authorityName?: string;
	currentScope: string;
	isAdmin: boolean;
	isGuest: boolean;
	isValidLogin: boolean;
	ltiSession?: LtiSessionDto;
	remoteAuthentications?: {
		[key: string]: RemoteAuthDescriptionDto;
	};
	sessionTimeout: number;
	statusCode?: string;
	toolPermissions?: Array<string>;
	userHome?: string;
}
