import { Injectable } from '@nestjs/common';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/external-tool-create.params';

@Injectable()
export class ExternalToolUc {
	async createExternalTool(body: ExternalToolParams): Promise<any> {
		return null;
	}
}
