import { UUID } from 'bson';
import CryptoJS from 'crypto-js';
import { DeepPartial, Factory } from 'fishery';
import OAuth, { Authorization, RequestOptions } from 'oauth-1.0a';
import { Lti11ContentItemType, Lti11DeepLinkParams } from '../controller/dto';
import { Lti11DeepLinkParamsRaw } from '../controller/dto/lti11-deep-link/lti11-deep-link-raw.params';

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
						startDatetime: new Date('2024-01'),
						endDatetime: new Date('2024-02'),
					},
					submission: {
						startDatetime: new Date('2024-01'),
						endDatetime: new Date('2024-02'),
					},
					custom: {
						dl_param: 'dl_value',
					},
				},
			],
		},
		oauth_callback: 'about:blank',
	};
});

export class Lti11DeepLinkParamsFactory {
	private readonly consumer: OAuth;

	constructor(
		private readonly url: string = 'https://default.deep-link.url/callback',
		private readonly key: string = 'defaultKey',
		private readonly secret: string = 'defaultSecret'
	) {
		this.consumer = new OAuth({
			consumer: {
				key: this.key,
				secret: this.secret,
			},
			signature_method: 'HMAC-SHA1',
			hash_function: (base_string: string, hashKey: string) =>
				CryptoJS.HmacSHA1(base_string, hashKey).toString(CryptoJS.enc.Base64),
		});
	}

	build(params?: DeepPartial<Lti11DeepLinkParamsPayload>): Lti11DeepLinkParams {
		const payload: Lti11DeepLinkParamsPayload = lti11DeepLinkParamsPayloadFactory.build(params);

		const requestData: RequestOptions = {
			url: this.url,
			method: 'POST',
			data: payload,
		};

		const authorization: Authorization = this.consumer.authorize(requestData);

		return authorization as Lti11DeepLinkParams;
	}

	buildRaw(params?: DeepPartial<Lti11DeepLinkParamsPayload>): Lti11DeepLinkParamsRaw {
		const payload: Lti11DeepLinkParamsPayload = lti11DeepLinkParamsPayloadFactory.build(params);

		const requestData: RequestOptions = {
			url: this.url,
			method: 'POST',
			data: { ...payload, content_items: JSON.stringify(payload.content_items) },
		};

		const authorization: Authorization = this.consumer.authorize(requestData);

		return authorization as Lti11DeepLinkParamsRaw;
	}
}
