import { UUID } from 'bson';
import CryptoJS from 'crypto-js';
import { DeepPartial, Factory } from 'fishery';
import OAuth, { Authorization, RequestOptions } from 'oauth-1.0a';
import { Lti11ContentItemType, Lti11DeepLinkParams } from '../controller/dto';

type Lti11DeepLinkParamsPayload = Omit<Lti11DeepLinkParams, keyof Authorization>;

export const lti11DeepLinkParamsPayloadFactory = Factory.define<Lti11DeepLinkParamsPayload>(() => {
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
					title: 'Deep Link Content',
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
	};
});

export class Lti11DeepLinkParamsFactory {
	constructor(
		private readonly url: string = 'https://default.deep-link.url/callback',
		private readonly key: string = 'defaultKey',
		private readonly secret: string = 'defaultSecret'
	) {}

	build(params?: DeepPartial<Lti11DeepLinkParamsPayload>): Lti11DeepLinkParams {
		const payload: Lti11DeepLinkParamsPayload = lti11DeepLinkParamsPayloadFactory.build(params);

		const requestData: RequestOptions = {
			url: this.url,
			method: 'POST',
			data: payload,
		};

		const consumer: OAuth = new OAuth({
			consumer: {
				key: this.key,
				secret: this.secret,
			},
			signature_method: 'HMAC-SHA1',
			hash_function: (base_string: string, hashKey: string) =>
				CryptoJS.HmacSHA1(base_string, hashKey).toString(CryptoJS.enc.Base64),
		});

		const authorization: Authorization = consumer.authorize(requestData);

		return authorization as Lti11DeepLinkParams;
	}
}
