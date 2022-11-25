import { Injectable } from '@nestjs/common';
import { CustomParameterDO, ExternalToolDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { CourseExternalToolRepo } from '@shared/repo/courseexternaltool/course-external-tool.repo';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';

@Injectable()
export class ExternalToolService {
	constructor(
		private readonly externalToolRepo: ExternalToolRepo,
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly courseExternalToolRepo: CourseExternalToolRepo
	) {}

	async createExternalTool(externalToolDO: ExternalToolDO): Promise<ExternalToolDO> {
		const externalTool: ExternalToolDO = await this.externalToolRepo.save(externalToolDO);
		return externalTool;
	}

	async deleteExternalTool(toolId: string): Promise<void> {
		const schoolExternalTools: SchoolExternalToolDO[] = await this.schoolExternalToolRepo.findByToolId(toolId);
		const schoolExternalToolIds: string[] = schoolExternalTools.map(
			(schoolExternalTool: SchoolExternalToolDO): string => {
				// We can be sure that the repo returns the id
				return schoolExternalTool.id as string;
			}
		);

		await Promise.all([
			this.courseExternalToolRepo.deleteBySchoolExternalToolIds(schoolExternalToolIds),
			this.schoolExternalToolRepo.deleteByToolId(toolId),
			this.externalToolRepo.deleteById(toolId),
		]);
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
