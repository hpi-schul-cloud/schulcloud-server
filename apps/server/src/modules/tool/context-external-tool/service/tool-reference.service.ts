import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ContextExternalToolConfigurationStatus } from '../../common/domain';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolLogoService, ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalTool, ToolReference } from '../domain';
import { ToolReferenceMapper } from '../mapper';
import { ContextExternalToolService } from './context-external-tool.service';
import { ToolVersionService } from './tool-version-service';

@Injectable()
export class ToolReferenceService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly externalToolLogoService: ExternalToolLogoService,
		private readonly toolVersionService: ToolVersionService
	) {}

	async getToolReference(contextExternalToolId: EntityId): Promise<ToolReference> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.findByIdOrFail(
			contextExternalToolId
		);
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			contextExternalTool.schoolToolRef.schoolToolId
		);
		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

		const status: ContextExternalToolConfigurationStatus = this.toolVersionService.determineToolConfigurationStatus(
			externalTool,
			schoolExternalTool,
			contextExternalTool
		);

		const toolReference: ToolReference = ToolReferenceMapper.mapToToolReference(
			externalTool,
			contextExternalTool,
			status
		);
		toolReference.logoUrl = this.externalToolLogoService.buildLogoUrl(
			'/v3/tools/external-tools/{id}/logo',
			externalTool
		);

		return toolReference;
	}
}
