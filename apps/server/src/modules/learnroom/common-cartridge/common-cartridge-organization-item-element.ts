import { IComponentProperties } from '@src/shared/domain/entity/lesson.entity';
import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeOrganizationProps = {
	identifier: string;
	title?: string;
	contents?: IComponentProperties[] | [];
};

export class CommonCartridgeOrganizationItemElement implements ICommonCartridgeElement {
	constructor(private readonly props: ICommonCartridgeOrganizationProps) {}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
			},
			title: this.props.title,
			content: this.props.contents,
		};
	}
}
