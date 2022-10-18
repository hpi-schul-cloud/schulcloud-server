import { Authorization } from 'oauth-1.0a';
import { Lti11LaunchResponse } from '@src/modules/tool/controller/dto/response/lti11-launch.response';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Lti11ResponseMapper {
	mapAuthorizationToResponse(authorization: Authorization): Lti11LaunchResponse {
		return new Lti11LaunchResponse({ ...authorization });
	}
}
