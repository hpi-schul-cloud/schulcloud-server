/* eslint-disable no-promise-executor-return */
export async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
