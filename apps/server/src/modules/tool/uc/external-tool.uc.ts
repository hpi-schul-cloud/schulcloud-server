import { Injectable, NotImplementedException } from '@nestjs/common';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { ExternalTool } from '@shared/domain';

@Injectable()
export class ExternalToolUc {
	async createExternalTool(body: ExternalToolParams): Promise<ExternalTool> {
		return Promise.reject(new NotImplementedException());
	}
}
