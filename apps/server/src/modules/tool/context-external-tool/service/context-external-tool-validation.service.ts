import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalTool } from '../uc/dto/context-external-tool.types';
import { ContextExternalToolDO } from '../domainobject';

@Injectable()
export class ContextExternalToolValidationService {
	constructor(private readonly contextExternalToolRepo: ContextExternalToolRepo) {}

	async validate(contextExternalTool: ContextExternalTool): Promise<void> {
		await this.checkDuplicateInContext(contextExternalTool);
	}

	private async checkDuplicateInContext(contextExternalTool: ContextExternalTool) {
		const duplicate: ContextExternalToolDO[] = await this.contextExternalToolRepo.find({
			schoolToolRef: contextExternalTool.schoolToolRef,
			context: contextExternalTool.contextRef,
		});

		if (duplicate.length > 0) {
			throw new UnprocessableEntityException('Tool is already assigned.');
		}
	}
}
