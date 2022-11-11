import { Injectable } from '@nestjs/common';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { ICurrentUser } from '@shared/domain';
import { ExternalToolService } from '@src/modules/tool/service/external-tool.service';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool.do';

@Injectable()
export class ExternalToolUc {
	constructor(private readonly externalToolService: ExternalToolService) {}

	async createExternalTool(externalToolParams: ExternalToolParams, currentUser: ICurrentUser): Promise<ExternalToolDO> {
		const externalTool: ExternalToolDO = await this.externalToolService.createExternalTool(externalToolParams);
		// validate
		// map request to DO
		// Service Call
		// encrypt secret
		// validation of name and other
	}
}
