import { LtiToolMapper } from '@src/modules/tool/mapper/lti-tool.mapper';
import { LtiToolBody } from '@src/modules/tool/controller/dto/lti-tool.body';
import { LtiPrivacyPermission, LtiRoleType } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';

describe('LtiToolMapper', () => {
	let mapper: LtiToolMapper;

	beforeAll(() => {
		mapper = new LtiToolMapper();
	});

	describe('mapLtiToolBodyToDO', () => {
		it('should map controller body to uc do', () => {
			const ltiToolBody: LtiToolBody = {
				customs: [{ key: 'key', value: 'value' }],
				friendlyUrl: 'friendlyUrl',
				frontchannel_logout_uri: 'frontchannel_logout_uri',
				id: 'id',
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
});
