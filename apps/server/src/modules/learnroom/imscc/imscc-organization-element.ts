import { IImsccElement } from './imscc-element.interface';

export type ImsccOrganizationProps = {
	identifier: string | number;
	title: string;
};

export class ImsccOrganizationElement implements IImsccElement {
	constructor(private readonly prop: ImsccOrganizationProps) {}

	getElement(): Record<string, unknown> {}
}
