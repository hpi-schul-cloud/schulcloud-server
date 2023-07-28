import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalToolDto } from '../uc/dto/context-external-tool.types';
import { ContextExternalTool } from '../domain';

@Injectable()
export class ContextExternalToolValidationService {
	constructor(private readonly contextExternalToolRepo: ContextExternalToolRepo) {}

	async validate(contextExternalToolDto: ContextExternalToolDto): Promise<void> {
		await this.checkDuplicateInContext(contextExternalToolDto);
	}

	private async checkDuplicateInContext(contextExternalToolDto: ContextExternalToolDto) {
		const duplicate: ContextExternalTool[] = await this.contextExternalToolRepo.find({
			schoolToolRef: contextExternalToolDto.schoolToolRef,
			context: contextExternalToolDto.contextRef,
		});

		if (duplicate.length > 0) {
			throw new UnprocessableEntityException('Tool is already assigned.');
		}
	}
}
