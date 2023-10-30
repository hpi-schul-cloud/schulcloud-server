import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { ToolConfigurationStatus } from '../../common/enum/tool-configuration-status';
import { CommonToolService } from '../../common/service/common-tool.service';
import { ExternalTool } from '../../external-tool/domain/external-tool.do';
import { ExternalToolLogoService } from '../../external-tool/service/external-tool-logo.service';
import { ExternalToolService } from '../../external-tool/service/external-tool.service';
import { SchoolExternalTool } from '../../school-external-tool/domain/school-external-tool.do';
import { SchoolExternalToolService } from '../../school-external-tool/service/school-external-tool.service';
import { ContextExternalTool } from '../domain/context-external-tool.do';
import { ToolReference } from '../domain/tool-reference';
import { ToolReferenceMapper } from '../mapper/tool-reference.mapper';
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
