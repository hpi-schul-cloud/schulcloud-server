import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalTool } from '../domain';
import { ContextExternalToolDto } from '../uc/dto/context-external-tool.types';
import { ContextExternalToolService } from './context-external-tool.service';

@Injectable()
export class ContextExternalToolValidationService {
	constructor(
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly commonToolValidationService: CommonToolValidationService
	) {}

	async validate(toValidate: ContextExternalToolDto): Promise<void> {
		const contextExternalTool: ContextExternalTool = new ContextExternalTool(toValidate);

		await this.checkDuplicateInContext(contextExternalTool);

		const loadedSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.getSchoolExternalToolById(
			contextExternalTool.schoolToolRef.schoolToolId
		);

		const loadedExternalTool: ExternalTool = await this.externalToolService.findExternalToolById(
			loadedSchoolExternalTool.toolId
		);

		this.commonToolValidationService.checkCustomParameterEntries(loadedExternalTool, contextExternalTool);
	}

	private async checkDuplicateInContext(contextExternalTool: ContextExternalTool) {
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
			throw new ValidationError(
				`tool_with_name_exists: A tool with the same name is already assigned to this course. Tool names must be unique within a course.`
			);
		}
	}
}
