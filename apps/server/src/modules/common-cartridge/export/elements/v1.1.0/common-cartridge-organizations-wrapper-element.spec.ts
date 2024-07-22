import {
	createCommonCartridgeOrganizationElementPropsV110,
	createCommonCartridgeOrganizationsWrapperElementPropsV110,
} from '../../../testing/common-cartridge-element-props.factory';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException, VersionNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElementFactory } from '../common-cartridge-element-factory';
import { CommonCartridgeOrganizationsWrapperElementV110 } from './common-cartridge-organizations-wrapper-element';

describe('CommonCartridgeOrganizationsWrapperElementV110', () => {
	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			const setup = () => {
				const props = createCommonCartridgeOrganizationsWrapperElementPropsV110();
				const sut = new CommonCartridgeOrganizationsWrapperElementV110(props);

				return { sut, props };
			};

			it('should return correct version', () => {
				const { sut } = setup();

				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});

		describe('when using not supported Common Cartridge version', () => {
			const notSupportedProps = createCommonCartridgeOrganizationsWrapperElementPropsV110();
			notSupportedProps.version = CommonCartridgeVersion.V_1_3_0;

			it('should throw error', () => {
				expect(() => new CommonCartridgeOrganizationsWrapperElementV110(notSupportedProps)).toThrow(
					VersionNotSupportedLoggableException
				);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when creating organization wrapper xml object', () => {
			const setup = () => {
				const organizationProps = createCommonCartridgeOrganizationElementPropsV110();
				const props = createCommonCartridgeOrganizationsWrapperElementPropsV110([
					CommonCartridgeElementFactory.createElement(organizationProps),
				]);
				const sut = new CommonCartridgeOrganizationsWrapperElementV110(props);

				return { sut, organizationProps };
			};

			it('should return organization wrapper manifest fragment', () => {
				const { sut, organizationProps } = setup();

				const result = sut.getManifestXmlObject(CommonCartridgeElementType.ORGANIZATIONS_WRAPPER);

				expect(result).toStrictEqual({
					organization: [
						{
							$: {
								identifier: 'org-1',
								structure: 'rooted-hierarchy',
							},
							item: [
								{
									$: {
										identifier: 'LearningModules',
									},
									item: [
										{
											$: {
												identifier: organizationProps.identifier,
											},
											title: organizationProps.title,
											item: [],
										},
									],
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
				const props = createCommonCartridgeOrganizationsWrapperElementPropsV110();
				const sut = new CommonCartridgeOrganizationsWrapperElementV110(props);

				return { sut, unknownElementType };
			};

			it('should throw error', () => {
				const { sut, unknownElementType } = setup();

				expect(() => sut.getManifestXmlObject(unknownElementType)).toThrow(ElementTypeNotSupportedLoggableException);
			});
		});
	});
});
