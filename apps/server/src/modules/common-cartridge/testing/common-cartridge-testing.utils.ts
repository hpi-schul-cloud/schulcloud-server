import { Stream } from 'stream';

export function streamToString(stream: Stream): Promise<string> {
	const chunks: Buffer[] = [];
	return new Promise((resolve, reject) => {
		stream.on('data', (chunk: ArrayBufferLike) => chunks.push(Buffer.from(chunk)));
		stream.on('error', (err) => reject(err));
		stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
	});
}
