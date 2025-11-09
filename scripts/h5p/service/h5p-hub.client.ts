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
		} catch (error: unknown) {
			if (this.isObjectWithResponseStatus(error) && error.response.status === 404) {
				throw new Error(`No content type available at H5P Hub for ${library}.`);
			} else {
				throw new Error(`Unknown error fetching library.json from repository ${library}: ${error}`);
			}
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

	private isObjectWithResponseStatus(obj: unknown): obj is { response: { status: number } } {
		return (
			typeof obj === 'object' &&
			obj !== null &&
			'response' in obj &&
			typeof (obj as any).response === 'object' &&
			'status' in (obj as any).response &&
			typeof (obj as any).response.status === 'number'
		);
	}
}
