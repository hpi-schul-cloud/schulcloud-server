import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeAssignmentProps = {
	identifier: string;
	title: string;
	description: string;
};

export class CommonCartridgeAssignmentElement implements ICommonCartridgeElement {
	constructor(readonly props: ICommonCartridgeAssignmentProps) {}

	transform(): Record<string, unknown> {
		return {
			assignment: {
				$: {
					identifier: this.props.identifier,
					xmlns: 'http://www.imsglobal.org/xsd/imscc_extensions/assignment',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation':
						'http://www.imsglobal.org/xsd/imscc_extensions/assignment http://www.imsglobal.org/profile/cc/cc_extensions/cc_extresource_assignmentv1p0_v1p0.xsd',
				},
				title: this.props.title,
				instructor_text: {
					$: {
						texttype: 'text/html',
					},
					_: this.props.description,
				},
				text: {
					$: {
						texttype: 'text/html',
					},
					_: this.props.description,
				},
				gradable: true,
				submission_formats: {
					format: [
						{
							$: {
								type: 'html',
							},
						},
						{
							$: {
								type: 'text',
							},
						},
						{
							$: {
								type: 'file',
							},
						},
					],
				},
			},
		};
	}
}
