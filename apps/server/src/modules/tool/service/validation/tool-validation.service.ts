import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ExternalToolDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { ExternalToolService } from '../external-tool.service';
import { CommonToolValidationService } from './common-tool-validation.service';

@Injectable()
export class ToolValidationService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly commonToolValidationService: CommonToolValidationService
	) {}

	async validateCreate(externalToolDO: ExternalToolDO): Promise<void> {
		await this.commonToolValidationService.validateCommon(externalToolDO);

		if (
			externalToolDO.config instanceof Oauth2ToolConfigDO &&
			!(await this.commonToolValidationService.isClientIdUnique(externalToolDO))
		) {
			throw new UnprocessableEntityException(`The Client Id of the tool: ${externalToolDO.name} is already used`);
		}
	}

	async validateUpdate(toolId: string, externalToolDO: Partial<ExternalToolDO>): Promise<void> {
		if (toolId !== externalToolDO.id) {
			throw new UnprocessableEntityException(`The tool has no id or it does not match the path parameter.`);
		}

		await this.commonToolValidationService.validateCommon(externalToolDO);

		const loadedTool: ExternalToolDO = await this.externalToolService.findExternalToolById(toolId);
		if (
			loadedTool.config instanceof Oauth2ToolConfigDO &&
			externalToolDO.config &&
			externalToolDO.config.type !== loadedTool.config.type
		) {
			throw new UnprocessableEntityException(`The Config Type of the tool ${externalToolDO.name || ''} is immutable.`);
		}

		if (
			externalToolDO.config instanceof Oauth2ToolConfigDO &&
			loadedTool.config instanceof Oauth2ToolConfigDO &&
			externalToolDO.config.clientId !== loadedTool.config.clientId
		) {
			throw new UnprocessableEntityException(`The Client Id of the tool ${externalToolDO.name || ''} is immutable.`);
		}
	}
}
