import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { CustomParameterDO, ExternalToolDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { ExternalToolService } from './external-tool.service';

@Injectable()
export class ToolValidationService {
	constructor(private readonly externalToolService: ExternalToolService) {}

	async validateCreate(externalToolDO: ExternalToolDO): Promise<void> {
		this.validateCommon(externalToolDO);

		if (!(await this.isNameUnique(externalToolDO))) {
			throw new UnprocessableEntityException(`The tool name "${externalToolDO.name}" is already used`);
		}
		if (externalToolDO.config instanceof Oauth2ToolConfigDO && !(await this.isClientIdUnique(externalToolDO.config))) {
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
				throw new UnprocessableEntityException(`The Config Type of the tool: ${externalToolDO.name} is immutable`);
			}
			if (
				loadedTool.config instanceof Oauth2ToolConfigDO &&
				externalToolDO.config.clientId !== loadedTool.config.clientId
			) {
				throw new UnprocessableEntityException(`The Client Id of the tool: ${externalToolDO.name} is immutable`);
			}
		}
	}

	private validateCommon(externalToolDO: ExternalToolDO): void {
		if (!externalToolDO) {
			return;
		}
		if (externalToolDO.parameters && this.hasDuplicateAttributes(externalToolDO.parameters)) {
			throw new UnprocessableEntityException(
				`The tool: ${externalToolDO.name} contains multiple of the same custom parameters`
			);
		}
		if (externalToolDO.parameters && !this.validateByRegex(externalToolDO.parameters)) {
			throw new UnprocessableEntityException(
				`A custom Parameter of the tool: ${externalToolDO.name} has wrong regex attribute.`
			);
		}
	}

	private async isNameUnique(externalToolDO: ExternalToolDO): Promise<boolean> {
		const duplicate: ExternalToolDO | null = await this.externalToolService.findExternalToolByName(externalToolDO.name);
		return duplicate == null || duplicate.id === externalToolDO.id;
	}

	private async isClientIdUnique(oauth2ToolConfig: Oauth2ToolConfigDO): Promise<boolean> {
		const duplicate: ExternalToolDO | null = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(
			oauth2ToolConfig.clientId
		);
		return (
			duplicate == null ||
			(duplicate.config instanceof Oauth2ToolConfigDO && duplicate.config.clientId === oauth2ToolConfig.clientId)
		);
	}

	private hasDuplicateAttributes(customParameter: CustomParameterDO[]): boolean {
		return customParameter.some((item, itemIndex) => {
			return customParameter.some((other, otherIndex) => itemIndex !== otherIndex && item.name === other.name);
		});
	}

	private validateByRegex(customParameter: CustomParameterDO[]): boolean {
		return customParameter.every((param: CustomParameterDO) => {
			if (param.regex) {
				try {
					// eslint-disable-next-line no-new
					new RegExp(param.regex);
				} catch (e) {
					return false;
				}
			}
			return true;
		});
	}
}
