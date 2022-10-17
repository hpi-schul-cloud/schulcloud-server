import { LtiToolMapper } from '@src/modules/tool/mapper/lti-tool.mapper';
import { LtiToolParams } from '@src/modules/tool/controller/dto/lti-tool.params';
import { LtiPrivacyPermission, LtiRoleType } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolResponse } from '@src/modules/tool/controller/dto/lti-tool.response';
import { InternalServerErrorException } from '@nestjs/common';

describe('LtiToolMapper', () => {
	let mapper: LtiToolMapper;

	beforeAll(() => {
		mapper = new LtiToolMapper();
	});

	describe('mapLtiToolBodyToDO', () => {
		it('should map controller body to uc do', () => {
			const ltiToolBody: LtiToolParams = {
				customs: [{ key: 'key', value: 'value' }],
				friendlyUrl: 'friendlyUrl',
				frontchannel_logout_uri: 'frontchannel_logout_uri',
				isHidden: false,
				isLocal: false,
				isTemplate: false,
				lti_message_type: 'lti_message_type',
				lti_version: 'lti_version',
				oAuthClientId: 'oAuthClientId',
				openNewTab: false,
				originToolId: 'originToolId',
				privacy_permission: LtiPrivacyPermission.EMAIL,
				resource_link_id: 'resource_link_id',
				roles: [LtiRoleType.LEARNER, LtiRoleType.MENTOR],
				skipConsent: false,
				name: 'name',
				url: 'url',
				key: 'key',
				secret: 'secret',
				logo_url: 'logo_url',
			};
			const expectedResponse: LtiToolDO = new LtiToolDO({ ...ltiToolBody });

			const result: LtiToolDO = mapper.mapLtiToolBodyToDO(ltiToolBody);

			expect(result).toEqual(expectedResponse);
		});
	});

	describe('mapDoToResponse', () => {
		it('should map do to response', () => {
			const ltiToolDo: LtiToolDO = {
				id: 'id',
				createdAt: new Date('2020-01-01T00:00:00.000Z'),
				updatedAt: new Date('2020-01-01T00:00:00.000Z'),
				customs: [{ key: 'key', value: 'value' }],
				friendlyUrl: 'friendlyUrl',
				frontchannel_logout_uri: 'frontchannel_logout_uri',
				isHidden: false,
				isLocal: false,
				isTemplate: false,
				lti_message_type: 'lti_message_type',
				lti_version: 'lti_version',
				oAuthClientId: 'oAuthClientId',
				openNewTab: false,
				originToolId: 'originToolId',
				privacy_permission: LtiPrivacyPermission.EMAIL,
				resource_link_id: 'resource_link_id',
				roles: [LtiRoleType.LEARNER, LtiRoleType.MENTOR],
				skipConsent: false,
				name: 'name',
				url: 'url',
				key: 'key',
				secret: 'secret',
				logo_url: 'logo_url',
			};
			const expectedResponse: LtiToolResponse = new LtiToolResponse({ ...ltiToolDo, id: 'id' });

			const result: LtiToolResponse = mapper.mapDoToResponse(ltiToolDo);

			expect(result).toEqual(expectedResponse);
		});

		it('should throw error when the id is undefined', () => {
			const ltiToolDo: LtiToolDO = {
				createdAt: new Date('2020-01-01T00:00:00.000Z'),
				updatedAt: new Date('2020-01-01T00:00:00.000Z'),
				customs: [{ key: 'key', value: 'value' }],
				friendlyUrl: 'friendlyUrl',
				frontchannel_logout_uri: 'frontchannel_logout_uri',
				isHidden: false,
				isLocal: false,
				isTemplate: false,
				lti_message_type: 'lti_message_type',
				lti_version: 'lti_version',
				oAuthClientId: 'oAuthClientId',
				openNewTab: false,
				originToolId: 'originToolId',
				privacy_permission: LtiPrivacyPermission.EMAIL,
				resource_link_id: 'resource_link_id',
				roles: [LtiRoleType.LEARNER, LtiRoleType.MENTOR],
				skipConsent: false,
				name: 'name',
				url: 'url',
				key: 'key',
				secret: 'secret',
				logo_url: 'logo_url',
			};

			const func = () => mapper.mapDoToResponse(ltiToolDo);

			expect(func).toThrow(InternalServerErrorException);
		});
	});
});
