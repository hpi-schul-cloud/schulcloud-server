import { Injectable, NotImplementedException } from '@nestjs/common';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { ExternalTool, ICurrentUser } from '@shared/domain';

import { LtiToolRepo } from '@shared/repo';
import { UserService } from '@src/modules/user/service/user.service';
import { ExternalToolService } from '@src/modules/tool/service/external-tool.service';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool.do';

@Injectable()
export class ExternalToolUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly ltiToolRepo: LtiToolRepo,
		private readonly userService: UserService
	) {}

	async createExternalTool(externalToolParams: ExternalToolParams, currentUser: ICurrentUser): Promise<ExternalToolDO> {
		const externalTool: ExternalToolDO = await this.externalToolService.createExternalTool(externalToolParams);
		// validate
		// map request to DO
		// Service Call
		// encrypt secret
		// validation of name and other
	}
}
