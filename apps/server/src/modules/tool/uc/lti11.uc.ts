import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CustomLtiProperty, LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolRepo } from '@shared/repo';
import { ICurrentUser, LtiPrivacyPermission, RoleName } from '@shared/domain';
import { UserService } from '@src/modules/user/service/user.service';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import OAuth, { Authorization, RequestOptions } from 'oauth-1.0a';
import { Lti11Service } from '../service/lti11.service';
import { Lti11PayloadDto } from './dto/lti11-payload.dto';
import { LtiRole } from '../interface/lti-role.enum';
import { LtiRoleMapper } from './mapper/lti-role.mapper';

@Injectable()
export class Lti11Uc {
	constructor(
		private readonly lti11Service: Lti11Service,
		private readonly ltiRoleMapper: LtiRoleMapper,
		private readonly ltiToolRepo: LtiToolRepo,
		private readonly userService: UserService
	) {}

	async getLaunchParameters(currentUser: ICurrentUser, toolId: string, courseId: string): Promise<Authorization> {
		const tool: LtiToolDO = await this.ltiToolRepo.findById(toolId);

		const payload = await this.createPayload(currentUser, tool, courseId, toolId);
		const customFields = this.createCustomFields(tool);
		const requestData = this.buildRequestOptions(tool, payload, customFields);

		const consumer: OAuth = this.lti11Service.createConsumer(tool.key, tool.secret);
		const authorization: Authorization = consumer.authorize(requestData);
		return authorization;
	}

	private async createPayload(
		currentUser: ICurrentUser,
		tool: LtiToolDO,
		courseId: string,
		toolId: string
	): Promise<Lti11PayloadDto> {
		const ltiRole: LtiRole | undefined = this.ltiRoleMapper.mapRoleToLtiRole(currentUser.roles[0] as RoleName);
		const user: UserDto = await this.userService.getUser(currentUser.userId);
		if (tool.lti_version !== 'LTI-1p0' || !tool.lti_message_type) {
			throw new InternalServerErrorException(`Tool ${toolId} is not a valid Lti v1.1 tool`);
		}
		const payload = new Lti11PayloadDto({
			lti_version: tool.lti_version,
			lti_message_type: tool.lti_message_type,
			resource_link_id: tool.resource_link_id || courseId,
			roles: ltiRole,
			launch_presentation_document_target: 'window',
			launch_presentation_locale: 'en',
			user_id: await this.lti11Service.getUserIdOrPseudonym(currentUser.userId, toolId, tool.privacy_permission),
		});
		if (tool.privacy_permission === LtiPrivacyPermission.NAME) {
			payload.lis_person_name_full = await this.userService.getDisplayName(user);
		}
		if (tool.privacy_permission === LtiPrivacyPermission.EMAIL) {
			payload.lis_person_contact_email_primary = user.email;
		}
		return payload;
	}

	private createCustomFields(tool: LtiToolDO): Record<string, string> {
		const customFields: Record<string, string> = {};
		tool.customs.forEach((custom: CustomLtiProperty) => {
			customFields[`custom_${custom.key}`] = custom.value;
		});
		return customFields;
	}

	private buildRequestOptions(
		tool: LtiToolDO,
		payload: Lti11PayloadDto,
		customFields: Record<string, string>
	): RequestOptions {
		const requestData: RequestOptions = {
			url: tool.url,
			method: 'POST',
			data: { ...payload, ...customFields },
		};
		return requestData;
	}
}
