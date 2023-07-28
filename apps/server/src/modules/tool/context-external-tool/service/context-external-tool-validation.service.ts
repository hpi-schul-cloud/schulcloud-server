import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ContextExternalToolDO, ExternalToolDO, SchoolExternalToolDO } from '@shared/domain';
import { CommonToolValidationService } from '../../common/service';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalTool } from '../uc/dto/context-external-tool.types';
import { ContextExternalToolService } from './context-external-tool.service';

@Injectable()
export class ContextExternalToolValidationService {
	constructor(
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly commonToolValidationService: CommonToolValidationService
	) {}

	async validate(toValidate: ContextExternalTool): Promise<void> {
		const contextExternalTool: ContextExternalToolDO = new ContextExternalToolDO(toValidate);

		await this.checkDuplicateInContext(contextExternalTool);

		const loadedSchoolExternalTool: SchoolExternalToolDO =
			await this.schoolExternalToolService.getSchoolExternalToolById(contextExternalTool.schoolToolRef.schoolToolId);

		const loadedExternalTool: ExternalToolDO = await this.externalToolService.findExternalToolById(
			loadedSchoolExternalTool.toolId
		);

		this.commonToolValidationService.checkCustomParameterEntries(loadedExternalTool, contextExternalTool);
	}

	private async checkDuplicateInContext(contextExternalTool: ContextExternalToolDO) {
		const duplicate: ContextExternalToolDO[] = await this.contextExternalToolService.findContextExternalTools({
			schoolToolRef: contextExternalTool.schoolToolRef,
			context: contextExternalTool.contextRef,
		});

		if (duplicate.length > 0) {
			throw new UnprocessableEntityException('Tool is already assigned.');
		}
	}
}
