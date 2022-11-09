import { Injectable } from '@nestjs/common';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';

@Injectable()
export class ExternalToolUc {
	async createExternalTool(body: ExternalToolParams): Promise<any> {
		return null;
	}
}
