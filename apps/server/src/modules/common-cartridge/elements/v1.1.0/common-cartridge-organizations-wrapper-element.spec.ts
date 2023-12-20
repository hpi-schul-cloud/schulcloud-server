import { faker } from '@faker-js/faker';
import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElementFactory, CommonCartridgeElementProps } from '../common-cartridge-element-factory';
import {
	CommonCartridgeOrganizationsWrapperElementPropsV110,
	CommonCartridgeOrganizationsWrapperElementV110,
} from './common-cartridge-organizations-wrapper-element';

describe('CommonCartridgeOrganizationsWrapperElementV110', () => {
	const setup = () => {
		const organizationProps: CommonCartridgeElementProps = {
			type: CommonCartridgeElementType.ORGANIZATION,
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
			items: [],
		};
		const props: CommonCartridgeOrganizationsWrapperElementPropsV110 = {
			type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
			version: CommonCartridgeVersion.V_1_1_0,
			items: [
				CommonCartridgeElementFactory.createElement({
					...organizationProps,
					version: CommonCartridgeVersion.V_1_1_0,
				}),
			],
		};
		const sut = new CommonCartridgeOrganizationsWrapperElementV110(props);

		return { sut, props, organizationProps };
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
						new CommonCartridgeOrganizationsWrapperElementV110({
							type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
							version: CommonCartridgeVersion.V_1_3_0,
						} as CommonCartridgeOrganizationsWrapperElementPropsV110)
				).toThrowError(InternalServerErrorException);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return correct manifest xml object', () => {
				const { sut, organizationProps } = setup();
				const result = sut.getManifestXmlObject();

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
	});
});
