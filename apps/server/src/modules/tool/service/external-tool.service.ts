import { Injectable } from '@nestjs/common';
import { CustomParameterDO, ExternalToolDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { IFindOptions } from '@shared/domain';
import { Page } from '@shared/domain/interface/page';

@Injectable()
export class ExternalToolService {
	constructor(private externalToolRepo: ExternalToolRepo) {}

	async createExternalTool(externalToolDO: ExternalToolDO): Promise<ExternalToolDO> {
		const externalTool: ExternalToolDO = await this.externalToolRepo.save(externalToolDO);
		return externalTool;
	}

	async updateExternalTool(externalToolDO: ExternalToolDO): Promise<ExternalToolDO> {
		externalToolDO.version += 1;
		const externalTool: ExternalToolDO = await this.externalToolRepo.save(externalToolDO);
		return externalTool;
	}

	async findExternalToolById(id: string): Promise<ExternalToolDO> {
		const externalTool: ExternalToolDO = await this.externalToolRepo.findById(id);
		return externalTool;
	}

	async isNameUnique(externalToolDO: ExternalToolDO): Promise<boolean> {
		const duplicate: ExternalToolDO | null = await this.externalToolRepo.findByName(externalToolDO.name);
		return duplicate == null;
	}

	async isClientIdUnique(oauth2ToolConfig: Oauth2ToolConfigDO): Promise<boolean> {
		const duplicate: ExternalToolDO | null = await this.externalToolRepo.findByOAuth2ConfigClientId(
			oauth2ToolConfig.clientId
		);

		return duplicate == null;
	}

	async findExternalTools(
		query: Partial<ExternalToolDO>,
		options: IFindOptions<ExternalToolDO>
	): Promise<Page<ExternalToolDO>> {
		const tools: Page<ExternalToolDO> = await this.externalToolRepo.find(query, options);
		return tools;
	}

	hasDuplicateAttributes(customParameter: CustomParameterDO[]): boolean {
		return customParameter.some((item, itemIndex) => {
			return customParameter.some((other, otherIndex) => itemIndex !== otherIndex && item.name === other.name);
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
