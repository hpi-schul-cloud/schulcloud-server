import { faker } from '@faker-js/faker';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import {
	CommonCartridgeResourceFactory,
	CommonCartridgeResourceProps,
} from '../../resources/common-cartridge-resource-factory';
import { CommonCartridgeElementFactory, CommonCartridgeElementProps } from '../common-cartridge-element-factory';
import {
	CommonCartridgeOrganizationElementPropsV110,
	CommonCartridgeOrganizationElementV110,
} from './common-cartridge-organization-element';

describe('CommonCartridgeOrganizationElementV110', () => {
	const setup = () => {
		const resourceProps: CommonCartridgeResourceProps = {
			type: CommonCartridgeResourceType.WEB_LINK,
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
			url: faker.internet.url(),
		};
		const subOrganizationProps: CommonCartridgeElementProps = {
			type: CommonCartridgeElementType.ORGANIZATION,
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
			items: CommonCartridgeResourceFactory.createResource({
				...resourceProps,
				version: CommonCartridgeVersion.V_1_1_0,
				folder: faker.string.alphanumeric(10),
			}),
		};
		const organizationProps: CommonCartridgeOrganizationElementPropsV110 = {
			type: CommonCartridgeElementType.ORGANIZATION,
			version: CommonCartridgeVersion.V_1_1_0,
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
			items: [
				CommonCartridgeElementFactory.createElement({
					...subOrganizationProps,
					version: CommonCartridgeVersion.V_1_1_0,
				}),
			],
		};
		const sut = new CommonCartridgeOrganizationElementV110(organizationProps);

		return { sut, organizationProps, subOrganizationProps, resourceProps };
	};

	describe('getSupportedVersion', () => {
		describe('when using common cartridge version 1.1.0', () => {
			it('should return correct version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		// AI next 12 lines
		describe('when using common cartridge version 1.1.0', () => {
			it('should return correct manifest xml object', () => {
				const { sut, organizationProps, subOrganizationProps, resourceProps } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toStrictEqual({
					$: {
						identifier: organizationProps.identifier,
					},
					title: organizationProps.title,
					item: [
						{
							$: {
								identifier: subOrganizationProps.identifier,
								identifierref: resourceProps.identifier,
							},
							title: subOrganizationProps.title,
						},
					],
				});
			});
		});
	});
});
