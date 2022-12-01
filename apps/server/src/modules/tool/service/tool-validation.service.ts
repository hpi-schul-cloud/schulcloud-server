import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ExternalToolDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { ExternalToolService } from './external-tool.service';

@Injectable()
export class ToolValidationService {
	constructor(private readonly externalToolService: ExternalToolService) {}

	private validateCommon(externalToolDO: ExternalToolDO): void {
		if (!externalToolDO) {
			return;
		}
		if (externalToolDO.parameters && this.externalToolService.hasDuplicateAttributes(externalToolDO.parameters)) {
			throw new UnprocessableEntityException(
				`The tool: ${externalToolDO.name} contains multiple of the same custom parameters`
			);
		}
		if (externalToolDO.parameters && !this.externalToolService.validateByRegex(externalToolDO.parameters)) {
			throw new UnprocessableEntityException(
				`A custom Parameter of the tool: ${externalToolDO.name} has wrong regex attribute.`
			);
		}
	}

	async validateCreate(externalToolDO: ExternalToolDO): Promise<void> {
		this.validateCommon(externalToolDO);

		if (!(await this.externalToolService.isNameUnique(externalToolDO))) {
			throw new UnprocessableEntityException(`The tool name "${externalToolDO.name}" is already used`);
		}
		if (
			externalToolDO.config instanceof Oauth2ToolConfigDO &&
			!(await this.externalToolService.isClientIdUnique(externalToolDO.config))
		) {
			throw new UnprocessableEntityException(`The Client Id of the tool: ${externalToolDO.name} is already used`);
		}
	}

	async validateUpdate(externalToolDO: ExternalToolDO): Promise<void> {
		this.validateCommon(externalToolDO);

		if (!externalToolDO.id) {
			throw new UnprocessableEntityException('TODO');
		}

		if (externalToolDO.config instanceof Oauth2ToolConfigDO) {
			const loadedTool: ExternalToolDO = await this.externalToolService.findExternalToolById(externalToolDO.id);
			if (externalToolDO.config.type !== loadedTool.config.type) {
				throw new UnprocessableEntityException(`TODO`);
			}
			if (
				loadedTool.config instanceof Oauth2ToolConfigDO &&
				externalToolDO.config.clientId !== loadedTool.config.clientId
			) {
				throw new UnprocessableEntityException(`TODO`);
			}
		}
	}
}
