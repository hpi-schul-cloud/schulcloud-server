import { Injectable } from '@nestjs/common';
import { CustomParameterDO, ExternalToolDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { ExternalToolDORepo } from '@shared/repo/externaltool/external-tool-do.repo';

@Injectable()
export class ExternalToolService {
	constructor(private externalToolRepo: ExternalToolDORepo) {}

	async createExternalTool(externalToolDO: ExternalToolDO): Promise<ExternalToolDO> {
		const externalTool: ExternalToolDO = await this.externalToolRepo.save(externalToolDO);
		return externalTool;
	}

	isNameUnique(externalToolDO: ExternalToolDO): boolean {
		const duplicate = this.externalToolRepo.findByName(externalToolDO.name);
		return duplicate !== null;
	}

	isClientIdUnique(externalToolDO: ExternalToolDO): boolean {
		const duplicate = this.externalToolRepo.findByOAuth2ConfigClientId(externalToolDO.config as Oauth2ToolConfigDO);
		return duplicate !== null;
	}

	hasDuplicateAttributes(customParameter: CustomParameterDO[]): boolean {
		return customParameter.some((item) => {
			return customParameter.some((other) => item.name === other.name);
		});
	}

	validateByRegex(customParameter: CustomParameterDO[]): boolean {
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
