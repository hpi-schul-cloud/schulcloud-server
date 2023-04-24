import { ICommonCartridgeLessonContentProps } from '@src/modules/learnroom/common-cartridge/common-cartrigde-lesson-content-element';
import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeOrganizationProps = {
	identifier: string;
	title?: string;
	contents?: ICommonCartridgeLessonContentProps[];
};

export class CommonCartridgeOrganizationItemElement implements ICommonCartridgeElement {
	constructor(private readonly props: ICommonCartridgeOrganizationProps) {}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
			},
			title: this.props.title,
		};
	}
}
