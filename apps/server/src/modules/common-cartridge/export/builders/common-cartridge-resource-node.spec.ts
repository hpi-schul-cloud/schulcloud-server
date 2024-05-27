import { createCommonCartridgeOrganizationNodeProps } from '../../testing/common-cartridge-node-props.factory';
import { createCommonCartridgeWebLinkResourceProps } from '../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces';
import { CommonCartridgeOrganizationNode } from './common-cartridge-organization-node';
import { CommonCartridgeResourceCollectionBuilder } from './common-cartridge-resource-collection-builder';
import { CommonCartridgeResourceNode, CommonCartridgeResourceNodeProps } from './common-cartridge-resource-node';

describe('CommonCartridgeResourceNode', () => {
	let sut: CommonCartridgeResourceNode;

	describe('build', () => {
		describe('when build is called', () => {
			const setup = () => {
				const resourceNodeProps: CommonCartridgeResourceNodeProps = {
					...createCommonCartridgeWebLinkResourceProps(),
					version: CommonCartridgeVersion.V_1_1_0,
				};

				const organizationNodeProps = createCommonCartridgeOrganizationNodeProps();

				const resourceCollectionBuilder: CommonCartridgeResourceCollectionBuilder =
					new CommonCartridgeResourceCollectionBuilder();

				const organizationNode = new CommonCartridgeOrganizationNode(
					organizationNodeProps,
					resourceCollectionBuilder,
					null
				);

				return { resourceNodeProps, organizationNode };
			};

			it('should return a CommonCartridgeResource', () => {
				const { resourceNodeProps, organizationNode } = setup();

				sut = new CommonCartridgeResourceNode(resourceNodeProps, organizationNode);

				const result = sut.build();

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeResource);
			});
		});
	});
});
