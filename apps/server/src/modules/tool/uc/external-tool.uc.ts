import { Injectable } from '@nestjs/common';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { ICurrentUser } from '@shared/domain';
import { ExternalToolService } from '@src/modules/tool/service/external-tool.service';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool.do';
import { ExternalToolMapper } from '@src/modules/tool/mapper/external-tool-do.mapper';

@Injectable()
export class ExternalToolUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly externalToolMapper: ExternalToolMapper
	) {}

	async createExternalTool(externalToolParams: ExternalToolParams, currentUser: ICurrentUser): Promise<ExternalToolDO> {
		const externalTool: ExternalToolDO = this.externalToolMapper.mapRequestToExternalToolDO(externalToolParams);
		const externalToolDO: ExternalToolDO = await this.externalToolService.createExternalTool(externalTool, currentUser);
		return externalToolDO;
	}
}
