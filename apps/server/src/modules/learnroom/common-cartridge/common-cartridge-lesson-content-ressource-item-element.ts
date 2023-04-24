import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeLessonContentResourceItemProps = {
	identifier: string;
	type: string;
	href: string;
};

export class CommonCartridgeLessonContentResourceItemElement implements ICommonCartridgeElement {
	constructor(private readonly props: ICommonCartridgeLessonContentResourceItemProps) {}

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
