import { Migration } from '@mikro-orm/migrations-mongodb';

type ExternalTools = {
	logoBase64: string;
};

const base64ImageTypeSignatures: Record<string, string> = {
	'/9j/': 'image/jpeg',
	iVBORw0KGgo: 'image/png',
	R0lGODdh: 'image/gif',
	R0lGODlh: 'image/gif',
};

export class Migration20250428115028 extends Migration {
	public async up(): Promise<void> {
		const cursor = this.getCollection<ExternalTools>('external-tools').find({
			logoBase64: { $exists: true },
		});

		for await (const tool of cursor) {
			const signature: string | undefined = Object.keys(base64ImageTypeSignatures).find((signature: string) =>
				tool.logoBase64.startsWith(signature)
			);

			const mimeType: string = signature ? base64ImageTypeSignatures[signature] : 'application/octet-stream';

			const dataUri = `data:${mimeType};base64,${tool.logoBase64}`;
			await this.getCollection<ExternalTools>('external-tools').updateOne(
				{ _id: tool._id },
				{
					$set: { logoBase64: dataUri },
				}
			);
		}
	}

	public async down(): Promise<void> {
		const cursor = this.getCollection<ExternalTools>('external-tools').find({
			logoBase64: { $exists: true },
		});

		for await (const tool of cursor) {
			if (!tool.logoBase64.startsWith('data:')) {
				continue;
			}

			const base64: string = tool.logoBase64.split(',')[1];

			await this.getCollection<ExternalTools>('external-tools').updateOne(
				{ _id: tool._id },
				{
					$set: { logoBase64: base64 },
				}
			);
		}
	}
}
