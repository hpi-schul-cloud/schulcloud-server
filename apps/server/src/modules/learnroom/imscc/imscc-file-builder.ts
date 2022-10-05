import { Readable } from 'stream';
import { Builder as XmlBuilder } from 'xml2js';
import AdmZip from 'adm-zip';
import { randomUUID } from 'crypto';

export class ImsccFileBuilder {
	private readonly zipBuiler = new AdmZip();

	private readonly xmlBuilder = new XmlBuilder({
		rootName: 'manifest',
	});

	private readonly manifest = {
		metadata: {},
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
	} as Record<string, unknown>;

	build(): Readable {
		const result = this.xmlBuilder.buildObject(this.manifest);
		this.zipBuiler.addFile('imsmanifest.xml', Buffer.from(result));
		return Readable.from(this.zipBuiler.toBuffer());
	}

	addTitle(title: string): ImsccFileBuilder {
		this.manifest.metadata = {
			schema: '1EdTech Thin Common Cartridge',
			schemaVersion: '1.3.2',
			lom: {
				$: {
					xmlns: 'http://ltsc.ieee.org/xsd/LOM',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation': 'http://ltsc.ieee.org/xsd/LOM http://www.imsglobal.org/xsd/imsmd_loose_v1p3p2.xsd',
				},
				general: {
					title: {
						string: title,
					},
				},
			},
		};
		return this;
	}
}
