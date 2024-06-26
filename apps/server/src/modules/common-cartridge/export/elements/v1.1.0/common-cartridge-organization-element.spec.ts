import { createCommonCartridgeOrganizationElementPropsV110 } from '../../../testing/common-cartridge-element-props.factory';
import { createCommonCartridgeWeblinkResourcePropsV110 } from '../../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException, VersionNotSupportedLoggableException } from '../../errors';
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
					VersionNotSupportedLoggableException
				);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when creating organization xml object', () => {
			const setup = () => {
				const resourceProps = createCommonCartridgeWeblinkResourcePropsV110();
				const subOrganization1Props = createCommonCartridgeOrganizationElementPropsV110();
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

			it('should return organization manifest fragment', () => {
				const { sut, organizationProps, subOrganization1Props, subOrganization2Props, resourceProps } = setup();

				const result = sut.getManifestXmlObject(CommonCartridgeElementType.ORGANIZATION);

				expect(result).toStrictEqual({
					$: {
						identifier: organizationProps.identifier,
					},
					title: organizationProps.title,
					item: [
						{
							$: {
								identifier: subOrganization1Props.identifier,
							},
							title: subOrganization1Props.title,
							item: [],
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

		describe('when using unsupported element type', () => {
			const setup = () => {
				const unknownElementType = 'unknown' as CommonCartridgeElementType;
				const props = createCommonCartridgeOrganizationElementPropsV110();
				const sut = new CommonCartridgeOrganizationElementV110(props);

				return { sut, unknownElementType };
			};

			it('should throw error', () => {
				const { sut, unknownElementType } = setup();

				expect(() => sut.getManifestXmlObject(unknownElementType)).toThrowError(
					ElementTypeNotSupportedLoggableException
				);
			});
		});
	});
});
