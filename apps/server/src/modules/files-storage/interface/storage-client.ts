import { IFile } from './file';

export interface IStorageClient {
	/**
	 * delete folder
	 *
	 * @param {string} folder
	 * @returns {*}
	 * @memberof IStorageClient
	 */
	deleteFolder(folder: string): unknown;
	/**
	 * list all files in folder
	 *
	 * @param {string} folder
	 * @returns {*}
	 * @memberof IStorageClient
	 */
	listFiles(folder: string): unknown;
	/**
	 * upload file
	 *
	 * @param {string} folder
	 * @param {IFile} file
	 * @returns {*}
	 * @memberof IStorageClient
	 */
	uploadFile(folder: string, file: IFile): unknown;
	/**
	 * get file
	 * @param path
	 */
	getFile(path: string): unknown;
	/**
	 * delete a file
	 *
	 * @param {string} path
	 * @returns {*}
	 * @memberof IStorageClient
	 */
	deleteFile(path: string): unknown;
}
