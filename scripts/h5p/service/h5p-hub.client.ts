import axios, { AxiosResponse } from 'axios';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

export class H5pHubClient {
	constructor() {}

	public async downloadContentType(library: string, filePath: string): Promise<void> {
		const url = `https://api.h5p.org/v1/content-types/${library}`;

		try {
			const response = await this.fetchContentType(url);

			const writer = createWriteStream(filePath);
			response.data.pipe(writer);

			await new Promise<void>((resolve, reject) => {
				writer.on('finish', () => resolve());
				writer.on('error', (err) => reject(err));
			});

			console.log(`Downloaded content type ${library} to ${filePath}`);
		} catch (error) {
			console.error(`Unknown error while downloading content type ${library}:`, error);
		}
	}

	private async fetchContentType(url: string): Promise<AxiosResponse<Readable>> {
		const response: AxiosResponse<Readable> = await axios({
			url,
			method: 'GET',
			responseType: 'stream',
		});

		if (response.status < 200 || response.status >= 300) {
			throw new Error(`H5P Hub content type request failed with status ${response.status}`);
		}

		return response;
	}
}
