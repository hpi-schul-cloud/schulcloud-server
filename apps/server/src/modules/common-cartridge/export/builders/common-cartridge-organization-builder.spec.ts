import { faker } from '@faker-js/faker/locale/af_ZA';
import { createCommonCartridgeWebContentResourcePropsV110 } from '../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement, CommonCartridgeResource } from '../interfaces';
import {
	CommonCartridgeOrganizationBuilder,
	CommonCartridgeOrganizationBuilderOptions,
} from './common-cartridge-organization-builder';

describe('CommonCartridgeOrganizationBuilder', () => {
	describe('build', () => {
		describe('when building a Common Cartridge organization with resources', () => {
			const setup = () => {
				const resources = new Array<CommonCartridgeResource>();

				const organizationOptions: CommonCartridgeOrganizationBuilderOptions = {
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
				};

				const resourceProps = createCommonCartridgeWebContentResourcePropsV110();

				const sut = new CommonCartridgeOrganizationBuilder(
					{
						...organizationOptions,
						version: CommonCartridgeVersion.V_1_1_0,
					},
					(resource) => resources.push(resource)
				)
					.addResource(resourceProps)
					.addSubOrganization(organizationOptions)
					.addResource(resourceProps)
					.addSubOrganization(organizationOptions)
					.addResource(resourceProps);

				return { sut, resources };
			};

			it('should return a common cartridge element', () => {
				const { sut, resources } = setup();

				const element = sut.build();

				expect(element).toBeInstanceOf(CommonCartridgeElement);
				expect(resources.length).toBe(3);
			});
		});

		describe('when building a Common Cartridge organization with items', () => {
			const setup = () => {
				const resources = new Array<CommonCartridgeResource>();

				const organizationOptions: CommonCartridgeOrganizationBuilderOptions = {
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
				};

				const resourceProps = createCommonCartridgeWebContentResourcePropsV110();

				const sut = new CommonCartridgeOrganizationBuilder(
					{
						...organizationOptions,
						version: CommonCartridgeVersion.V_1_1_0,
					},
					(resource) => resources.push(resource)
				)
					.addResource(resourceProps)
					.addSubOrganization(organizationOptions)
					.addResource(resourceProps)
					.addSubOrganization(organizationOptions)
					.addResource(resourceProps)
					.addResource(resourceProps);

				return { sut, resources };
			};

			it('should return a common cartridge element', () => {
				const { sut, resources } = setup();

				const element = sut.build();

				expect(element).toBeInstanceOf(CommonCartridgeElement);
				expect(resources.length).toBe(4);
			});
		});
	});
});
