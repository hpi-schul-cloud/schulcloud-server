/* istanbul ignore file */
/*
export type SyncOptions = {
	aggregationSize: number;
	numParallelPromises: number;
};
*/
export class FileSyncOptions {
	aggregationSize: number;

	numParallelPromises: number;

	constructor(aggregationSize: number | string, numParallelPromises: number | string) {
		this.aggregationSize = Number(aggregationSize);
		this.numParallelPromises = Number(numParallelPromises);
	}
}
