import { createMock } from '@golevelup/ts-jest';
import { createCommonCartridgeOrganizationNodeProps } from '../../testing/common-cartridge-element-props.factory';
import { createCommonCartridgeWebContentResourceProps } from '../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeOrganizationNode } from './common-cartridge-organization-node';
import { CommonCartridgeResourceCollectionBuilder } from './common-cartridge-resource-collection-builder';
import { CommonCartridgeResourceNode, CommonCartridgeResourceNodeProps } from './common-cartridge-resource-node';

describe('CommonCartridgeResourceCollectionBuilder', () => {
	let sut: CommonCartridgeResourceCollectionBuilder;

	const setupResourceNode = () => {
		const resourceNodeProps: CommonCartridgeResourceNodeProps = {
			...createCommonCartridgeWebContentResourceProps(),
			version: CommonCartridgeVersion.V_1_1_0,
		};
		const organizationNodeProps = createCommonCartridgeOrganizationNodeProps();
		const organizationNode = new CommonCartridgeOrganizationNode(organizationNodeProps, sut, null);
		const resourceNode = new CommonCartridgeResourceNode(resourceNodeProps, organizationNode);

		return resourceNode;
	};

	beforeEach(() => {
		sut = new CommonCartridgeResourceCollectionBuilder();
		jest.clearAllMocks();
	});

	describe('addResource', () => {
		describe('when a resource is added to the CommonCartridgeResourceCollectionBuilder', () => {
			const setup = () => {
				const resourceNode = setupResourceNode();
				const resourceNodesMock = createMock<CommonCartridgeResourceNode[]>();

				Reflect.set(sut, 'resourceNodes', resourceNodesMock);

				return { resourceNode, resourceNodesMock };
			};

			it('should add the resource node to the collection', () => {
				const { resourceNode, resourceNodesMock } = setup();

				sut.addResource(resourceNode);

				expect(resourceNodesMock.push).toHaveBeenCalledTimes(1);
				expect(resourceNodesMock.push).toHaveBeenCalledWith(resourceNode);
			});
		});
	});

	describe('build', () => {
		describe('when build method is called', () => {
			const setup = () => {
				const resourceNode1 = setupResourceNode();
				const resourceNode2 = setupResourceNode();

				return { resourceNode1, resourceNode2 };
			};

			it('should return the resource collection', () => {
				const { resourceNode1, resourceNode2 } = setup();

				sut.addResource(resourceNode1);
				sut.addResource(resourceNode2);

				const resources = sut.build();

				expect(resources).toHaveLength(2);
				expect(resources).toContainEqual(resourceNode1.build());
				expect(resources).toContainEqual(resourceNode2.build());
			});
		});
	});
});
