import { Factory } from 'fishery';
import { CommonCartridgeOrganizationProps } from '../import/common-cartridge-import.types';
import { faker } from '@faker-js/faker/.';
import { CommonCartridgeXmlResourceType } from '../import/common-cartridge-import.enums';

type CcOrgFactoryTransientParams = {
	parent: CommonCartridgeOrganizationProps;
};

class CommonCartridgeOrganizationPropsFactory extends Factory<
	CommonCartridgeOrganizationProps,
	CcOrgFactoryTransientParams
> {
	public withIdentifier(identifier: string): this {
		return this.params({ identifier });
	}

	public withTitle(title: string): this {
		return this.params({ title });
	}

	public withParent(parent: CommonCartridgeOrganizationProps): this {
		return this.transient({ parent });
	}

	public withResource(resourcePath?: string, resourceType?: string): this {
		return this.params({
			isResource: true,
			resourcePaths: [resourcePath ?? faker.system.filePath()],
			resourceType: resourceType ?? faker.lorem.word(),
		});
	}

	public withWebContent(name: string): this {
		return this.withResource(name, CommonCartridgeXmlResourceType.WEB_CONTENT);
	}

	public withWebLink(url: string): this {
		return this.withResource(url, CommonCartridgeXmlResourceType.WEB_LINK_CC11);
	}

	public withFile(name: string): this {
		return this.withResource(name, CommonCartridgeXmlResourceType.FILE);
	}
}

export const commonCartridgeOrganizationPropsFactory = CommonCartridgeOrganizationPropsFactory.define(
	({ params, transientParams }) => {
		const id = params.identifier ?? faker.string.uuid();

		const { parent } = transientParams;
		const parentDepth = parent?.pathDepth;
		const parentPath = parent?.path;

		const pathDepth = parentDepth !== undefined ? parentDepth + 1 : params.pathDepth ?? 0;
		const path = parentPath ? `${parentPath}/${id}` : params.path ?? id;

		return {
			pathDepth,
			title: params.title ?? faker.lorem.words(),
			identifier: id,
			path,
			isInlined: params.isInlined ?? false,
			isResource: params.isResource ?? false,
			resourcePaths: params.resourcePaths ?? [],
			resourceType: params.resourceType ?? '',
		};
	}
);
