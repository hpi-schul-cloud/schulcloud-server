import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResourceProps } from './common-cartridge-resource-factory';

export class CommonCartridgeResourcePropsFactory {
	static create(): CommonCartridgeResourceProps {
		switch (props.type) {
			case CommonCartridgeResourceType.LTI:
				return {
					type: CommonCartridgeResourceType.LTI,
					version: CommonCartridgeVersion.V_1_1_0,
					identifier: 'lti-resource-props-identifier',
					folder: 'lti-resource-props-folder',
					title: 'lti-resource-props-title',
					description: 'lti-resource-props-description',
					url: 'lti-resource-props-url',
				};
			case CommonCartridgeResourceType.WEB_CONTENT:
				return {
					type: CommonCartridgeResourceType.WEB_CONTENT,
					version: CommonCartridgeVersion.V_1_1_0,
					identifier: 'web-content-resource-props-identifier',
					folder: 'web-content-resource-props-folder',
					title: 'web-content-resource-resource-title',
					html: '<p>web-content-resource-props-html</p>',
				};
			case CommonCartridgeResourceType.WEB_LINK:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					version: CommonCartridgeVersion.V_1_1_0,
					identifier: 'web-link-resource-props-identifier',
					folder: 'web-link-resource-props-folder',
					title: 'web-link-resource-props-title',
					url: 'web-link-resource-props-url',
				};
			default:
				throw new InternalServerErrorException(`Unknown Common Cartridge resource props`);
		}
	}
}
