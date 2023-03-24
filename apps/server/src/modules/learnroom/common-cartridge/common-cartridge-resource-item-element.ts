import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeResourceProps = {
	identifier: string;
	type: string;
	href: string;
};

export class CommonCartridgeResourceItemElement implements ICommonCartridgeElement {
	constructor(protected readonly props: ICommonCartridgeResourceProps) {}

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
