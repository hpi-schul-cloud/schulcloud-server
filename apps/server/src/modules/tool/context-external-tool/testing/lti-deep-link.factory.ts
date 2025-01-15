import { BaseFactory } from '@testing/factory/base.factory';
import { CustomParameterEntry } from '../../common/domain';
import { LtiDeepLink } from '../domain';

export const ltiDeepLinkFactory = BaseFactory.define<LtiDeepLink, LtiDeepLink>(LtiDeepLink, ({ sequence }) => {
	return {
		mediaType: 'application/vnd.ims.lti.v1.ltiassignment',
		title: `Deep Link Content ${sequence}`,
		url: 'https://lti.deep.link',
		text: 'Deep link description',
		parameters: [new CustomParameterEntry({ name: 'dl_param', value: 'dl_value' })],
		availableFrom: new Date(),
		availableUntil: new Date(),
		submissionFrom: new Date(),
		submissionUntil: new Date(),
	};
});
