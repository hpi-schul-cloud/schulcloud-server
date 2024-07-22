import {
	createCommonCartridgeOrganizationElementPropsV130,
	createCommonCartridgeOrganizationsWrapperElementPropsV130,
} from '../../../testing/common-cartridge-element-props.factory';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException, VersionNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElementFactory } from '../common-cartridge-element-factory';
import { CommonCartridgeOrganizationsWrapperElementV130 } from './common-cartridge-organizations-wrapper-element';

describe('CommonCartridgeOrganizationsWrapperElementV130', () => {
	describe('getSupportedVersion', () => {
		describe('when using common cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeOrganizationsWrapperElementPropsV130();
				const sut = new CommonCartridgeOrganizationsWrapperElementV130(props);

				return { sut };
			};

			it('should return correct version', () => {
				const { sut } = setup();

				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
			});
		});

		describe('when using not supported common cartridge version', () => {
			const notSupportedProps = createCommonCartridgeOrganizationsWrapperElementPropsV130();
			notSupportedProps.version = CommonCartridgeVersion.V_1_1_0;

			it('should throw error', () => {
				expect(() => new CommonCartridgeOrganizationsWrapperElementV130(notSupportedProps)).toThrow(
					VersionNotSupportedLoggableException
				);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when creating organizations wrapper xml object', () => {
			const setup = () => {
				const organizationProps = createCommonCartridgeOrganizationElementPropsV130();
				const props = createCommonCartridgeOrganizationsWrapperElementPropsV130([
					CommonCartridgeElementFactory.createElement(organizationProps),
				]);
				const sut = new CommonCartridgeOrganizationsWrapperElementV130(props);

				return { sut, organizationProps };
			};

			it('should return organizations wrapper manifest fragment', () => {
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
				const props = createCommonCartridgeOrganizationsWrapperElementPropsV130();
				const sut = new CommonCartridgeOrganizationsWrapperElementV130(props);

				return { sut, unknownElementType };
			};

			it('should throw error', () => {
				const { sut, unknownElementType } = setup();

				expect(() => sut.getManifestXmlObject(unknownElementType)).toThrow(ElementTypeNotSupportedLoggableException);
			});
		});
	});
});
