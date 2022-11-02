import { ForbiddenException, Injectable } from '@nestjs/common';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { SchoolFeatures } from '@shared/domain';
import { SchoolService } from '@src/modules/school/service/school.service';
import { LtiToolRepo } from '@shared/repo';
import { Page } from '@shared/domain/types/page';

@Injectable()
export class LtiToolService {
	constructor(private readonly schoolService: SchoolService, private readonly ltiToolRepo: LtiToolRepo) {}

	setupBBB(tool: LtiToolDO, courseId: string): void {
		// update url if bbb request
		if (this.isBBBCreateRequest(tool)) {
			tool.url = `/videoconference/course/${courseId}`;
		}
	}

	private isBBBCreateRequest(tool: LtiToolDO): boolean {
		const isBBBCreate = tool.url === 'BBB_URL';
		return isBBBCreate;
	}

	async addSecret(tool: LtiToolDO): Promise<void> {
		if (tool.originToolId) {
			const originTool: LtiToolDO = await this.ltiToolRepo.findById(tool.originToolId);
			tool.secret = originTool.secret;
		}
	}

	async filterFindBBB(tools: Page<LtiToolDO>, schoolId: string): Promise<void> {
		const hasVideoconferenceItems = tools.data.some((tool) => this.isBBBTool(tool));
		if (hasVideoconferenceItems) {
			// if school feature disabled, remove bbb tools from results data
			const schoolHasVideoconferenceFeature = await this.schoolService.hasFeature(
				schoolId,
				SchoolFeatures.VIDEOCONFERENCE
			);
			if (!schoolHasVideoconferenceFeature) {
				tools.data.forEach((tool: LtiToolDO, index: number) => {
					if (this.isBBBTool(tool)) {
						tools.removeElement(index);
					}
				});
			}
		}
	}

	// TODO N21-91. Magic Strings are not desireable
	private isBBBTool(tool: LtiToolDO): boolean {
		const isBBB = tool.name === 'Video-Konferenz mit BigBlueButton';
		return isBBB;
	}

	async filterGetBBB(tool: LtiToolDO, schoolId: string): Promise<void> {
		if (this.isBBBTool(tool)) {
			const schoolHasVideoconferenceFeature = await this.schoolService.hasFeature(
				schoolId,
				SchoolFeatures.VIDEOCONFERENCE
			);
			if (!schoolHasVideoconferenceFeature) {
				throw new ForbiddenException('school feature disabled');
			}
		}
	}
}
