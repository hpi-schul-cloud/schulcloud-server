import { InternalServerErrorException } from '@nestjs/common';
import { createCommonCartridgeOrganizationElementPropsV110 } from '../../../testing/common-cartridge-element-props.factory';
import { createCommonCartridgeWeblinkResourcePropsV110 } from '../../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeResourceFactory } from '../../resources/common-cartridge-resource-factory';
import { CommonCartridgeElementFactory } from '../common-cartridge-element-factory';
import { CommonCartridgeOrganizationElementV110 } from './common-cartridge-organization-element';

describe('CommonCartridgeOrganizationElementV110', () => {
	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			const setup = () => {
				const props = createCommonCartridgeOrganizationElementPropsV110();
				const sut = new CommonCartridgeOrganizationElementV110(props);

				return { sut };
			};

			it('should return correct version', () => {
				const { sut } = setup();

				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});

		describe('when using not supported Common Cartridge version', () => {
			const notSupportedProps = createCommonCartridgeOrganizationElementPropsV110();
			notSupportedProps.version = CommonCartridgeVersion.V_1_3_0;

			it('should throw error', () => {
				expect(() => new CommonCartridgeOrganizationElementV110(notSupportedProps)).toThrowError(
					InternalServerErrorException
				);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			const setup = () => {
				const resourceProps = createCommonCartridgeWeblinkResourcePropsV110();

				const subOrganization1Props = createCommonCartridgeOrganizationElementPropsV110(
					CommonCartridgeResourceFactory.createResource(resourceProps)
				);

				const subOrganization2Props = createCommonCartridgeOrganizationElementPropsV110([
					CommonCartridgeResourceFactory.createResource(resourceProps),
				]);

				const organizationProps = createCommonCartridgeOrganizationElementPropsV110([
					CommonCartridgeElementFactory.createElement(subOrganization1Props),
					CommonCartridgeElementFactory.createElement(subOrganization2Props),
				]);

				const sut = new CommonCartridgeOrganizationElementV110(organizationProps);

				return { sut, organizationProps, subOrganization1Props, subOrganization2Props, resourceProps };
			};

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
										identifier: expect.any(String),
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
