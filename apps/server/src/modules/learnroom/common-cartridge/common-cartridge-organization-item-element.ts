import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { ICommonCartridgeResourceProps } from './common-cartridge-resource-item-element';
import { createIdentifier } from './utils';

export type ICommonCartridgeOrganizationProps = {
	identifier: string;
	title: string;
	version: string;
	resources: ICommonCartridgeResourceProps[];
};

export class CommonCartridgeOrganizationItemElement implements ICommonCartridgeElement {
	constructor(private readonly props: ICommonCartridgeOrganizationProps) {}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
			},
			title: this.props.title,
			item: this.props.resources.map((content) => {
				return {
					$: {
						identifier: createIdentifier(),
						identifierref: content.identifier,
					},
					title: content.title,
				};
			}),
		};
	}
}
