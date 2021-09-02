import { Injectable } from '@nestjs/common';

@Injectable()
export class DeleteFilesUc {
	/**
	 * Schedules files that have been removed prior removedSince by a user to be removed.
	 * @param removedSince
	 */
	removeDeletedFilesData(removedSince: Date): void {
		console.log('foo');
		// create filter
		// create cursor
		// enqueue files
		// delete s3 data
		// delete file document
	}
}
