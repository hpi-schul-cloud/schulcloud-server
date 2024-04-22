import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { ContextExternalToolNameAlreadyExistsLoggableException } from '@modules/tool/common/domain/error/context-external-tool-name-already-exists.loggable-exception';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalTool } from '../domain';
import { ContextExternalToolService } from './context-external-tool.service';

@Injectable()
export class ContextExternalToolValidationService {
	constructor(
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly commonToolValidationService: CommonToolValidationService
	) {}

	async validate(contextExternalTool: ContextExternalTool): Promise<void> {
		await this.checkDuplicateUsesInContext(contextExternalTool);

		const loadedSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			contextExternalTool.schoolToolRef.schoolToolId
		);

		const loadedExternalTool: ExternalTool = await this.externalToolService.findById(loadedSchoolExternalTool.toolId);

		const errors: ValidationError[] = this.commonToolValidationService.validateParameters(
			loadedExternalTool,
			contextExternalTool
		);

		if (errors.length) {
			throw errors[0];
		}
	}

	private async checkDuplicateUsesInContext(contextExternalTool: ContextExternalTool) {
		let duplicate: ContextExternalTool[] = await this.contextExternalToolService.findContextExternalTools({
			schoolToolRef: contextExternalTool.schoolToolRef,
			context: contextExternalTool.contextRef,
		});

		// Only leave tools that are not the currently handled tool itself (for updates) or ones with the same name
		duplicate = duplicate.filter(
			(duplicateTool) =>
				duplicateTool.id !== contextExternalTool.id && duplicateTool.displayName === contextExternalTool.displayName
		);

		if (duplicate.length > 0) {
			throw new ContextExternalToolNameAlreadyExistsLoggableException(duplicate[0].id, duplicate[0].displayName);
		}
	}
}
