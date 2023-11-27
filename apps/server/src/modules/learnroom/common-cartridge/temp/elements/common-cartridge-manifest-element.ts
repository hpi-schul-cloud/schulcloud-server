import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

type CommonCartridgeManifestElementProps = {
	metadata: CommonCartridgeElement;
	organizations: CommonCartridgeElement;
	resources: CommonCartridgeElement;
};

export class CommonCartridgeManifestElement implements CommonCartridgeElement {
	public constructor(private readonly props: CommonCartridgeManifestElementProps) {}

	public getManifestXml(): Record<string, unknown> {
		throw new Error('Method not implemented.');
	}
}
