/* istanbul ignore file */
/*
export type SyncOptions = {
	aggregationSize: number;
	numParallelPromises: number;
};
*/
// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
export class FileSyncOptions {
	aggregationSize: number;

	numParallelPromises: number;

	constructor(aggregationSize: number | string, numParallelPromises: number | string) {
		this.aggregationSize = Number(aggregationSize);
		this.numParallelPromises = Number(numParallelPromises);
	}
}
