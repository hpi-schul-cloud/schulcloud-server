import { UUID } from 'bson';
import { Factory } from 'fishery';
import { Lti11ContentItemType, Lti11DeepLinkParams } from '../controller/dto';

export const lti11DeepLinkParamsFactory = Factory.define<Lti11DeepLinkParams>(({ sequence }) => {
	return {
		lti_message_type: 'ContentItemSelection',
		lti_version: 'LTI-1p0',
		data: new UUID().toString(),
		content_items: {
			'@context': 'context',
			'@graph': [
				{
					'@type': Lti11ContentItemType.CONTENT_ITEM,
					mediaType: 'application/vnd.ims.lti.v1.ltiassignment',
					title: `Deep Link Content ${sequence}`,
					text: 'descriptive text',
					url: 'https://lti.deep.link',
					available: {
						startDatetime: new Date(),
						endDatetime: new Date(),
					},
					submission: {
						startDatetime: new Date(),
						endDatetime: new Date(),
					},
					custom: {
						dl_param: 'dl_value',
					},
				},
			],
		},
		oauth_version: '1.0',
		oauth_consumer_key: 'consumer key',
		oauth_nonce: 'nonce',
		oauth_signature: 'signature',
		oauth_signature_method: 'HMAC-SHA1',
		oauth_timestamp: Date.now(),
	};
});
