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

	function setup() {
		const customProperty: CustomLtiPropertyParameter = new CustomLtiPropertyParameter();
		customProperty.key = 'key';
		customProperty.value = 'value';

		const ltiToolPostBody: LtiToolPostBody = new LtiToolPostBody();
		ltiToolPostBody.customs = [customProperty];
		ltiToolPostBody.friendlyUrl = 'friendlyUrl';
		ltiToolPostBody.frontchannel_logout_uri = 'frontchannel_logout_uri';
		ltiToolPostBody.isHidden = false;
		ltiToolPostBody.isLocal = false;
		ltiToolPostBody.isTemplate = false;
		ltiToolPostBody.lti_message_type = 'lti_message_type';
		ltiToolPostBody.lti_version = 'lti_version';
		ltiToolPostBody.oAuthClientId = 'oAuthClientId';
		ltiToolPostBody.openNewTab = false;
		ltiToolPostBody.originToolId = 'originToolId';
		ltiToolPostBody.privacy_permission = LtiPrivacyPermission.EMAIL;
		ltiToolPostBody.resource_link_id = 'resource_link_id';
		ltiToolPostBody.roles = [LtiRoleType.LEARNER, LtiRoleType.MENTOR];
		ltiToolPostBody.skipConsent = false;
		ltiToolPostBody.name = 'name';
		ltiToolPostBody.url = 'url';
		ltiToolPostBody.key = 'key';
		ltiToolPostBody.secret = 'secret';
		ltiToolPostBody.logo_url = 'logo_url';

		const ltiToolPatchBody: LtiToolPatchBody = new LtiToolPatchBody();
		ltiToolPatchBody.customs = [customProperty];
		ltiToolPatchBody.friendlyUrl = 'friendlyUrl';
		ltiToolPatchBody.frontchannel_logout_uri = 'frontchannel_logout_uri';
		ltiToolPatchBody.isHidden = false;
		ltiToolPatchBody.isLocal = false;
		ltiToolPatchBody.isTemplate = false;
		ltiToolPatchBody.lti_message_type = 'lti_message_type';
		ltiToolPatchBody.lti_version = 'lti_version';
		ltiToolPatchBody.oAuthClientId = 'oAuthClientId';
		ltiToolPatchBody.openNewTab = false;
		ltiToolPatchBody.originToolId = 'originToolId';
		ltiToolPatchBody.privacy_permission = LtiPrivacyPermission.EMAIL;
		ltiToolPatchBody.resource_link_id = 'resource_link_id';
		ltiToolPatchBody.roles = [LtiRoleType.LEARNER, LtiRoleType.MENTOR];
		ltiToolPatchBody.skipConsent = false;
		ltiToolPatchBody.name = 'name';
		ltiToolPatchBody.url = 'url';
		ltiToolPatchBody.key = 'key';
		ltiToolPatchBody.secret = 'secret';
		ltiToolPatchBody.logo_url = 'logo_url';

		const ltiToolDo: LtiToolDO = {
			id: 'id',
			createdAt: new Date('2020-01-01T00:00:00.000Z'),
			updatedAt: new Date('2020-01-01T00:00:00.000Z'),
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

		return {
			ltiToolPostBody,
			ltiToolPatchBody,
			ltiToolDo,
		};
	}

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
			const { ltiToolPostBody } = setup();

			const expectedResponse: LtiToolDO = new LtiToolDO({ ...(ltiToolPostBody as LtiToolDO) });

			const result: LtiToolDO = mapper.mapLtiToolPostBodyToDO(ltiToolPostBody);

			expect(result).toEqual(expectedResponse);
		});

		it('result should contain openNewTab=false when it is undefined in the do', () => {
			const { ltiToolPostBody } = setup();
			ltiToolPostBody.openNewTab = undefined;

			const expectedResponse: LtiToolDO = new LtiToolDO({ ...(ltiToolPostBody as LtiToolDO) });

			const result: LtiToolDO = mapper.mapLtiToolPostBodyToDO(ltiToolPostBody);

			expect(result).toEqual(expectedResponse);
		});

		it('result should contain openNewTab=false when it is undefined in the do', () => {
			const { ltiToolPostBody } = setup();
			ltiToolPostBody.key = undefined;

			const expectedResponse: LtiToolDO = new LtiToolDO({ ...(ltiToolPostBody as LtiToolDO) });

			const result: LtiToolDO = mapper.mapLtiToolPostBodyToDO(ltiToolPostBody);

			expect(result).toEqual(expectedResponse);
		});
	});

	describe('mapLtiToolPatchBodyToDO', () => {
		it('should map controller patch body to uc do', () => {
			const { ltiToolPatchBody } = setup();

			const result: Partial<LtiToolDO> = mapper.mapLtiToolPatchBodyToDO(ltiToolPatchBody);

			expect(result).toEqual(ltiToolPatchBody);
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
			const { ltiToolDo } = setup();

			const expectedResponse: LtiToolResponse = new LtiToolResponse({ ...ltiToolDo, id: 'id', _id: 'id' });

			const result: LtiToolResponse = mapper.mapDoToResponse(ltiToolDo);

			expect(result).toEqual(expectedResponse);
		});

		it('should throw error when the id is undefined', () => {
			const { ltiToolDo } = setup();
			ltiToolDo.id = undefined;

			const func = () => mapper.mapDoToResponse(ltiToolDo);

			expect(func).toThrow(InternalServerErrorException);
		});
	});
});
