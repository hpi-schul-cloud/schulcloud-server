import { ICommonCartridgeLessonContentProps } from '@src/modules/learnroom/common-cartridge/common-cartridge-lesson-content-element';
import { ObjectId } from 'mongodb';
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
			item: this.props.contents?.map((content) => {
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
