import { Authorization } from 'oauth-1.0a';
import { Injectable } from '@nestjs/common';
import { Lti11LaunchResponse } from '../dto/response';

@Injectable()
export class Lti11ResponseMapper {
	mapAuthorizationToResponse(authorization: Authorization): Lti11LaunchResponse {
		return new Lti11LaunchResponse({ ...authorization });
	}
}
