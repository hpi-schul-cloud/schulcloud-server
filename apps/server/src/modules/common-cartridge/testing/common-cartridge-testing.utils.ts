import { type Stream } from 'stream';

export function streamToString(stream: Stream): Promise<string> {
	const chunks: Buffer[] = [];
	return new Promise((resolve, reject) => {
		stream.on('data', (chunk: ArrayBufferLike) => chunks.push(Buffer.from(chunk)));
		stream.on('error', (err: unknown) => reject(err instanceof Error ? err : new Error(String(err))));
		stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
	});
}
