import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalToolDO } from '@shared/domain';
import { ContextExternalTool } from '../../uc/dto';

@Injectable()
export class ContextExternalToolValidationService {
	constructor(private readonly contextExternalToolRepo: ContextExternalToolRepo) {}

	async validate(contextExternalTool: ContextExternalTool): Promise<void> {
		await this.checkDuplicateInContext(contextExternalTool);
	}

	private async checkDuplicateInContext(contextExternalTool: ContextExternalTool) {
		const duplicate: ContextExternalToolDO[] = await this.contextExternalToolRepo.find(contextExternalTool);
		if (duplicate) {
			throw new UnprocessableEntityException('Tool is already assigned.');
		}
	}
}
