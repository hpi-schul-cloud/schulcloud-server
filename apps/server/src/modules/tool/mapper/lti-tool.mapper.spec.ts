import { LtiToolMapper } from '@src/modules/tool/mapper/lti-tool.mapper';
import { LtiPrivacyPermission, LtiRoleType, SortOrder, SortOrderMap } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolResponse } from '@src/modules/tool/controller/dto/response/lti-tool.response';
import { InternalServerErrorException } from '@nestjs/common';
import { LtiToolPostBody } from '@src/modules/tool/controller/dto/request/lti-tool-post.body';
import { LtiToolPatchBody } from '@src/modules/tool/controller/dto/request/lti-tool-patch.body';
import { LtiToolSortOrder, SortLtiToolParams } from '@src/modules/tool/controller/dto/request/lti-tool-sort.params';
import { LtiToolParams } from '@src/modules/tool/controller/dto/request/lti-tool.params';
import { CustomLtiPropertyParameter } from '@src/modules/tool/controller/dto/request/custom-lti-property.params';

describe('LtiToolMapper', () => {
	let mapper: LtiToolMapper;

	beforeAll(() => {
		mapper = new LtiToolMapper();
	});

	describe('mapLtiToolFilterQueryToDO', () => {
		it('should map params to partial do', () => {
			const params: LtiToolParams = {
				name: 'name',
				isTemplate: false,
				isHidden: true,
			};

			const doPartial = mapper.mapLtiToolFilterQueryToDO(params);

			expect(doPartial).toEqual(expect.objectContaining(params));
		});
	});

	describe('mapLtiToolPostBodyToDO', () => {
		it('should map controller post body to uc do', () => {
			const ltiToolBody: LtiToolPostBody = {
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

			const result: LtiToolDO = mapper.mapLtiToolPostBodyToDO(ltiToolBody);

			expect(result).toEqual(expectedResponse);
		});
	});

	describe('mapLtiToolPatchBodyToDO', () => {
		it('should map controller patch body to uc do', () => {
			const customProperty: CustomLtiPropertyParameter = { key: 'key', value: 'value' };
			const ltiToolBody: LtiToolPatchBody = {
				customs: [customProperty],
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

			const result: Partial<LtiToolDO> = mapper.mapLtiToolPatchBodyToDO(ltiToolBody);

			expect(result).toEqual(ltiToolBody);
		});
	});

	describe('mapSortingQueryToDomain', () => {
		it('should map controller sorting query to domain sort order map', () => {
			const sortingQuery: SortLtiToolParams = {
				sortBy: LtiToolSortOrder.ID,
				sortOrder: SortOrder.asc,
			};

			const result: SortOrderMap<LtiToolDO> | undefined = mapper.mapSortingQueryToDomain(sortingQuery);

			expect(result).toEqual({ id: SortOrder.asc });
		});

		it('should map controller sorting query to undefined', () => {
			const sortingQuery: SortLtiToolParams = {
				sortOrder: SortOrder.asc,
			};

			const result: SortOrderMap<LtiToolDO> | undefined = mapper.mapSortingQueryToDomain(sortingQuery);

			expect(result).toBeUndefined();
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
