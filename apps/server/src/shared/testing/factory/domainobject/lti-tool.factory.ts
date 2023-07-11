import { LtiPrivacyPermission, LtiToolDO } from '@shared/domain';
import { DoBaseFactory } from './do-base.factory';

export const ltiToolDOFactory = DoBaseFactory.define<LtiToolDO, LtiToolDO>(LtiToolDO, ({ sequence }) => {
	return {
		name: `pseudonym${sequence}`,
		key: 'key',
		secret: 'secret',
		url: 'https://ltitool.com',
		isHidden: false,
		isTemplate: true,
		customs: [],
		privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
		roles: [],
		openNewTab: false,
	};
});
