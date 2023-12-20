import { faker } from '@faker-js/faker';
import { InternalServerErrorException } from '@nestjs/common';
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
		const subOrganization1Props: CommonCartridgeElementProps = {
			type: CommonCartridgeElementType.ORGANIZATION,
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
			items: CommonCartridgeResourceFactory.createResource({
				...resourceProps,
				version: CommonCartridgeVersion.V_1_1_0,
				folder: faker.string.alphanumeric(10),
			}),
		};
		const subOrganization2Props: CommonCartridgeElementProps = {
			type: CommonCartridgeElementType.ORGANIZATION,
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
			items: [
				CommonCartridgeResourceFactory.createResource({
					...resourceProps,
					version: CommonCartridgeVersion.V_1_1_0,
					folder: faker.string.alphanumeric(10),
				}),
			],
		};
		const organizationProps: CommonCartridgeOrganizationElementPropsV110 = {
			type: CommonCartridgeElementType.ORGANIZATION,
			version: CommonCartridgeVersion.V_1_1_0,
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
			items: [
				CommonCartridgeElementFactory.createElement({
					...subOrganization1Props,
					version: CommonCartridgeVersion.V_1_1_0,
				}),
				CommonCartridgeElementFactory.createElement({
					...subOrganization2Props,
					version: CommonCartridgeVersion.V_1_1_0,
				}),
			],
		};
		const sut = new CommonCartridgeOrganizationElementV110(organizationProps);

		return { sut, organizationProps, subOrganization1Props, subOrganization2Props, resourceProps };
	};

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return correct version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});

		describe('when using not supported Common Cartridge version', () => {
			it('should throw error', () => {
				expect(
					() =>
						new CommonCartridgeOrganizationElementV110({
							type: CommonCartridgeElementType.ORGANIZATION,
							version: CommonCartridgeVersion.V_1_3_0,
						} as CommonCartridgeOrganizationElementPropsV110)
				).toThrowError(InternalServerErrorException);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		// AI next 12 lines
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return correct manifest xml object', () => {
				const { sut, organizationProps, subOrganization1Props, subOrganization2Props, resourceProps } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toStrictEqual({
					$: {
						identifier: organizationProps.identifier,
					},
					title: organizationProps.title,
					item: [
						{
							$: {
								identifier: subOrganization1Props.identifier,
								identifierref: resourceProps.identifier,
							},
							title: subOrganization1Props.title,
						},
						{
							$: {
								identifier: subOrganization2Props.identifier,
							},
							title: subOrganization2Props.title,
							item: [
								{
									$: {
										identifier: resourceProps.identifier,
										identifierref: resourceProps.identifier,
									},
									title: resourceProps.title,
								},
							],
						},
					],
				});
			});
		});
	});
});
