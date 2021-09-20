class AbstractFileStorageStrategy {
	constructor() {
		if (new.target === AbstractFileStorageStrategy) {
			throw new TypeError('Cannot construct AbstractFileStorageStrategy instances directly.');
		}
	}

	connect() {
		throw new TypeError('connect method has to be implemented.');
	}

	getBucket() {
		throw new TypeError('getBucket method has to be implemented');
	}

	listBucketsNames() {
		throw new TypeError('listBucketsNames method has to be implemented');
	}

	create() {
		throw new TypeError('create method has to be implemented.');
	}

	getFiles() {
		throw new TypeError('getFiles method has to be implemented.');
	}

	deleteFile() {
		throw new TypeError('deleteFile method has to be implemented.');
	}

	generateSignedUrl() {
		throw new TypeError('generateSignedUrl method has to be implemented.');
	}

	createDirectory() {
		throw new TypeError('createDirectory method has to be implemented.');
	}

	deleteDirectory() {
		throw new TypeError('deleteDirectory method has to be implemented.');
	}

	copyFile() {
		throw new TypeError('copyFile method has to be implemented.');
	}
}

module.exports = AbstractFileStorageStrategy;
