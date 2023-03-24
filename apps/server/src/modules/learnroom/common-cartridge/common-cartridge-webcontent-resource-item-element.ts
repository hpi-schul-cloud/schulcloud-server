import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeWebContentProps = {
	identifier: string;
	href: string;
	file: Buffer;
	parentFolder?: string;
};

export class CommonCartridgeWebContentResourceItemElement implements ICommonCartridgeElement {
	constructor(protected readonly props: ICommonCartridgeWebContentProps) {}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: 'webcontent',
				href: this.props.href,
			},
			file: {
				$: {
					href: this.props.href,
				},
			},
		};
	}
}
