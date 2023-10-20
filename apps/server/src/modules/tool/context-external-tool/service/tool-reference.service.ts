import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ToolConfigurationStatus } from '../../common/enum';
import { CommonToolService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolLogoService, ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalTool, ToolReference } from '../domain';
import { ToolReferenceMapper } from '../mapper';
import { ContextExternalToolService } from './context-external-tool.service';

@Injectable()
export class ToolReferenceService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly commonToolService: CommonToolService,
		private readonly externalToolLogoService: ExternalToolLogoService
	) {}

	async getToolReference(contextExternalToolId: EntityId): Promise<ToolReference> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.findById(
			contextExternalToolId
		);
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			contextExternalTool.schoolToolRef.schoolToolId
		);
		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

		const status: ToolConfigurationStatus = this.commonToolService.determineToolConfigurationStatus(
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
