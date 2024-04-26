import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { createCommonCartridgeWebLinkResourceProps } from '../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces';
import {
	CommonCartridgeOrganizationNode,
	CommonCartridgeOrganizationNodeProps,
} from './common-cartridge-organization-node';
import { CommonCartridgeResourceCollectionBuilder } from './common-cartridge-resource-collection-builder';

describe('CommonCartridgeOrganizationNode', () => {
	const setupOrganizationNodeProps = () => {
		const props: CommonCartridgeOrganizationNodeProps = {
			type: CommonCartridgeElementType.ORGANIZATION,
			version: CommonCartridgeVersion.V_1_1_0,
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
		};

		return props;
	};
	const setupResourcesMock = () => {
		const mock = createMock<CommonCartridgeResourceCollectionBuilder>();

		return mock;
	};
	const setupResourceProps = () => {
		const resourceProps = createCommonCartridgeWebLinkResourceProps();

		return resourceProps;
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('folder', () => {
		describe('when organization node has no parent', () => {
			const setup = () => {
				const resourcesMock = setupResourcesMock();
				const props = setupOrganizationNodeProps();
				const sut = new CommonCartridgeOrganizationNode(props, resourcesMock, null);

				return { sut, props };
			};

			it('should return its own id as folder', () => {
				const { sut, props } = setup();

				const result = sut.folder;

				expect(result).toBe(props.identifier);
			});
		});

		describe('when organization node has parent', () => {
			// AI next 15 lines
			const setup = () => {
				const resourcesMock = setupResourcesMock();
				const props = setupOrganizationNodeProps();
				const parentProps = setupOrganizationNodeProps();
				const parent = new CommonCartridgeOrganizationNode(parentProps, resourcesMock, null);
				const sut = new CommonCartridgeOrganizationNode(props, resourcesMock, parent);

				return { sut, props, parentProps };
			};

			it('should construct folder path from parent and own identifier', () => {
				const { sut, props, parentProps } = setup();

				const result = sut.folder;

				expect(result).toBe(`${parentProps.identifier}/${props.identifier}`);
			});
		});
	});

	describe('createChild', () => {
		describe('when creating a child organization node', () => {
			const setup = () => {
				const resourcesMock = setupResourcesMock();
				const childrenMock = createMock<CommonCartridgeElement[]>();
				const props = setupOrganizationNodeProps();
				const childProps = setupOrganizationNodeProps();
				const sut = new CommonCartridgeOrganizationNode(props, resourcesMock, null);

				Reflect.set(sut, 'children', childrenMock);

				return { sut, childProps, childrenMock };
			};

			it('should return a new organization node', () => {
				const { sut, childProps } = setup();

				const result = sut.createChild(childProps);

				expect(result).toBeInstanceOf(CommonCartridgeOrganizationNode);
				expect(result).not.toBe(sut);
			});

			it('should add new organization node to children', () => {
				const { sut, childProps, childrenMock } = setup();

				const result = sut.createChild(childProps);

				expect(result).toBeDefined();
				expect(childrenMock.push).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('addResource', () => {
		describe('when adding a resource to an organization node', () => {
			const setup = () => {
				const resourcesMock = setupResourcesMock();
				const childrenMock = createMock<CommonCartridgeElement[]>();
				const props = setupOrganizationNodeProps();
				const resourceProps = setupResourceProps();
				const sut = new CommonCartridgeOrganizationNode(props, resourcesMock, null);

				return { sut, resourceProps, childrenMock, resourcesMock };
			};

			it('should call addResource on resource collection builder', () => {
				const { sut, resourceProps, resourcesMock } = setup();

				sut.addResource(resourceProps);

				expect(resourcesMock.addResource).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('build', () => {
		describe('when building an organization node', () => {
			const setup = () => {
				const resourcesMock = setupResourcesMock();
				const props = setupOrganizationNodeProps();
				const sut = new CommonCartridgeOrganizationNode(props, resourcesMock, null);
				const childProps = setupOrganizationNodeProps();
				const childNode = sut.createChild(childProps);
				const childNodeBuildSpy = jest.spyOn(childNode, 'build');

				return { sut, childNodeBuildSpy };
			};

			it('should return an common cartridge element', () => {
				const { sut } = setup();

				const result = sut.build();

				expect(result).toBeInstanceOf(CommonCartridgeElement);
			});

			it('should build all children', () => {
				const { sut, childNodeBuildSpy } = setup();

				const result = sut.build();

				expect(result).toBeDefined();
				expect(childNodeBuildSpy).toHaveBeenCalledTimes(1);
			});
		});
	});
});
