import {
	ICommonCartridgeOrganizationProps,
	CommonCartridgeOrganizationItemElement,
} from './common-cartridge-organization-item-element';
import { CommonCartridgeVersion, CommonCartridgeResourceType } from './common-cartridge-enums';
import { ICommonCartridgeResourceProps } from './common-cartridge-resource-item-element';

describe('CommonCartridgeOrganizationItemElement', () => {
	describe('transform', () => {
		it('should return correct organization item element regardless of common cartridge version', () => {
			const webContentResourceProps: ICommonCartridgeResourceProps = {
				type: CommonCartridgeResourceType.WEB_CONTENT,
				version: CommonCartridgeVersion.V_1_3_0,
				identifier: 'web-link',
				href: 'https://example.com/link',
				title: 'Web Link',
				html: 'html tags for testing',
			};
			const props: ICommonCartridgeOrganizationProps = {
				identifier: 'identifier',
				title: 'title of organization item element',
				version: 'version of common cartridge',
				resources: [webContentResourceProps],
			};
			const organizationItemElement = new CommonCartridgeOrganizationItemElement(props);
			const transformed = organizationItemElement.transform();
			expect(transformed).toEqual({
				$: {
					identifier: props.identifier,
				},
				title: props.title,
				item: [
					{
						$: {
							identifier: expect.any(String),
							identifierref: webContentResourceProps.identifier,
						},
						title: webContentResourceProps.title,
					},
				],
			});
		});
	});
});
