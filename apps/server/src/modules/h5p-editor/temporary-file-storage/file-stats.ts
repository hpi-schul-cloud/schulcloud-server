import { IFileStats } from '@lumieducation/h5p-server';

export class FileStats implements IFileStats {
	birthtime: Date;

	size: number;

	constructor(birthtime: Date, size: number) {
		this.birthtime = birthtime;
		this.size = size;
	}
}
