import { ObjectId } from 'bson';
import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { CommonCartridgeVersion } from './common-cartridge-enums';
import { ICommonCartridgeResourceProps } from './common-cartridge-resource-item-element';

export type ICommonCartridgeOrganizationProps = {
	identifier: string;
	title: string;
	version: CommonCartridgeVersion;
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
				const newId = new ObjectId();
				return {
					$: {
						identifier: `i${newId.toString()}`,
						identifierref: content.identifier,
					},
					title: content.title,
				};
			}),
		};
	}
}
