import { BaseFactory } from '@shared/testing';
import { CustomParameterEntry } from '../../common/domain';
import { LtiDeepLink } from '../domain';

export const ltiDeepLinkFactory = BaseFactory.define<LtiDeepLink, LtiDeepLink>(LtiDeepLink, ({ sequence }) => {
	return {
		mediaType: 'application/vnd.ims.lti.v1.ltilink',
		title: `Deep Link Content ${sequence}`,
		url: 'https://lti.deep.link',
		parameters: [new CustomParameterEntry({ name: 'dl_param', value: 'dl_value' })],
	};
});
