import { Readable } from 'stream';
import { Builder } from 'xml2js';
import AdmZip from 'adm-zip';
import { randomUUID } from 'crypto';

export class ImsccFileBuilder {
	private readonly zipBuilder = new AdmZip();

	private readonly xmlBuilder = new Builder({
		rootName: 'manifest',
	});

	private readonly manifest = {
		metadata: {
			schema: '1EdTech Thin Common Cartridge',
			schemaVersion: '1.3.2',
			lom: {
				$: {
					xmlns: 'http://ltsc.ieee.org/xsd/LOM',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation': 'http://ltsc.ieee.org/xsd/LOM http://www.imsglobal.org/xsd/imsmd_loose_v1p3p2.xsd',
				},
				general: {
					title: null as null | { string: string },
				},
			},
		},
		organizations: {
			organization: [
				{
					$: {
						identifier: 'placeholder-org',
						structure: 'rooted-hierarchy',
					},
					item: [
						{
							$: {
								identifier: randomUUID().toString(),
							},
							title: 'Placeholder',
						},
					],
				},
			],
		},
		resources: {
			resource: [
				{
					$: {
						identifier: randomUUID().toString(),
						type: 'webcontent',
						href: 'placeholder.html',
					},
					file: 'placeholder.html',
				},
			],
		},
	};

	async build(): Promise<Readable> {
		const result = this.xmlBuilder.buildObject(this.manifest);
		this.zipBuilder.addFile('imsmanifest.xml', Buffer.from(result), 'The required manifest file.');
		return Readable.from(await this.zipBuilder.toBufferPromise());
	}

	addTitle(title: string): ImsccFileBuilder {
		this.manifest.metadata.lom.general.title = { string: title };
		return this;
	}
}
