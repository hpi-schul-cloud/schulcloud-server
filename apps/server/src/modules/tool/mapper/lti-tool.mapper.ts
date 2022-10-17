import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolBody } from '@src/modules/tool/controller/dto/lti-tool.body';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LtiToolMapper {
	mapLtiToolBodyToDO(body: LtiToolBody): LtiToolDO {
		const ltiTool: LtiToolDO = new LtiToolDO({ ...body });
		return ltiTool;
	}
}
