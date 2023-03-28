import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeAssignmentResourceItemProps = {
	identifier: string;
	type: string;
	href: string;
};

export class CommonCartridgeAssignmentResourceItemElement implements ICommonCartridgeElement {
	constructor(private readonly props: ICommonCartridgeAssignmentResourceItemProps) {}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type,
			},
			file: {
				$: {
					href: this.props.href,
				},
			},
		};
	}
}
