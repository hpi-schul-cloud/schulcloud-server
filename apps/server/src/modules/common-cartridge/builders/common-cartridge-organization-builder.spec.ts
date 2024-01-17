import { faker } from '@faker-js/faker/locale/af_ZA';
import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { CommonCartridgeResourceProps } from '../resources/common-cartridge-resource-factory';
import {
	CommonCartridgeOrganizationBuilder,
	CommonCartridgeOrganizationBuilderOptions,
} from './common-cartridge-organization-builder';

describe('CommonCartridgeOrganizationBuilder', () => {
	describe('build', () => {
		describe('when building a Common Cartridge organization', () => {
			const setup = () => {
				const resources = new Array<CommonCartridgeResource>();
				const organizationOptions: CommonCartridgeOrganizationBuilderOptions = {
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
				};
				const resourceProps: CommonCartridgeResourceProps = {
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
					html: faker.lorem.paragraphs(),
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				};
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
				const { sut } = setup();
				const element = sut.build();

				expect(element).toBeInstanceOf(CommonCartridgeElement);
			});
		});
	});
});
