import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeOrganizationElement } from '../elements/common-cartridge-organization-element';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { CommonCartridgeResourcePropsInternal } from '../resources/common-cartridge-resource-factory';
import {
	CommonCartridgeOrganizationBuilder,
	CommonCartridgeOrganizationBuilderOptions,
} from './common-cartridge-organization-builder';

describe('CommonCartridgeOrganizationBuilder', () => {
	let sut: CommonCartridgeOrganizationBuilder;

	const resources = new Array<CommonCartridgeResource>();

	const organizationOptions: CommonCartridgeOrganizationBuilderOptions = {
		title: 'organization-title',
		identifier: 'organization-identifier',
		version: CommonCartridgeVersion.V_1_1_0,
	};
	const subOrganizationOptions: CommonCartridgeOrganizationBuilderOptions = {
		title: 'sub-organization-title',
		identifier: 'sub-organization-identifier',
		version: CommonCartridgeVersion.V_1_1_0,
	};
	const subSubOrganizationOptions: CommonCartridgeOrganizationBuilderOptions = {
		title: 'sub-sub-organization-title',
		identifier: 'sub-sub-organization-identifier',
		version: CommonCartridgeVersion.V_1_1_0,
	};
	const resource1Props: CommonCartridgeResourcePropsInternal = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		identifier: 'resource-1-identifier',
		title: 'resource-1-title',
		html: '<p>resource-1-html</p>',
	};
	const resource2Props: CommonCartridgeResourcePropsInternal = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		identifier: 'resource-2-identifier',
		title: 'resource-2-title',
		html: '<p>resource-2-html</p>',
	};
	const resource3Props: CommonCartridgeResourcePropsInternal = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		identifier: 'resource-3-identifier',
		title: 'resource-3-title',
		html: '<p>resource-3-html</p>',
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	/*
	TODO:
	- create testfactories for CommonCartridgeResourceProps and CommonCartridgeOrganizationBuilderOptions
	- move fixture creation into setup function (you can even inline it, eg. .addSubOrganization(CommonCartrigeOrganizationFactory.build()))
	- use setup function instead of beforeAll to get rid of "global" variables
	*/

	describe('build', () => {
		describe('when creating a common cartridge archive', () => {
			beforeAll(() => {
				sut = new CommonCartridgeOrganizationBuilder(organizationOptions, (resource) =>
					resources.push(resource)
				);
				sut.addResource(resource1Props)
					.addSubOrganization(subOrganizationOptions)
					.addResource(resource2Props)
					.addSubOrganization(subSubOrganizationOptions)
					.addResource(resource3Props)
					.build();
			});

			it('should return a common cartridge organization element', () => {
				const element = sut.build();

				expect(element).toBeDefined();
				expect(element).toBeInstanceOf(CommonCartridgeOrganizationElement);
			});

			it('should add 3 resources', () => {
				expect(resources).toHaveLength(3);
			});
		});
	});
});
