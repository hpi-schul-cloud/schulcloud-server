import { Factory } from 'fishery';
import { CommonCartridgeOrganizationProps } from '../import/common-cartridge-import.types';
import { faker } from '@faker-js/faker/.';

export function joinCommonCartridgeOrganizationPath(...elements: string[]): string {
	return elements.join('/');
}

export const commonCartridgeOrganizationPropsFactory = Factory.define<CommonCartridgeOrganizationProps>(
	({ params }) => {
		const id = params.identifier ?? faker.string.uuid();

		return {
			pathDepth: params.pathDepth ?? 0,
			title: params.title ?? faker.lorem.words(),
			identifier: id,
			path: params.path ?? id,
			isInlined: params.isInlined ?? false,
			isResource: params.isResource ?? false,
			resourcePath: params.resourcePath ?? '',
			resourceType: params.resourceType ?? '',
		};
	}
);
