import { LtiToolResponse } from '@src/modules/tool/controller/dto/lti-tool.response';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { NotImplementedException } from '@nestjs/common';

export class LtiToolResponseMapper {
	mapDoToResponse(tool: LtiToolDO): LtiToolResponse {
		throw new NotImplementedException();
	}
}
