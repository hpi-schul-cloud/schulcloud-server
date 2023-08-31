import { Injectable } from '@nestjs/common';

@Injectable()
export class H5PLibraryManagementService {
	async run() {
		// for debugging only
		// eslint-disable-next-line no-console
		console.log('Hello from H5PLibraryManagementService');
		return Promise.resolve();
	}
}
