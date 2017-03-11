class AbstractFileStorageStrategy {
	constructor() {
		if (new.target === AbstractFileStorageStrategy) {
			throw new TypeError("Cannot construct AbstractFileStorageStrategy instances directly.");
		}
	}

	create() {
		throw new TypeError("create method has to be implemented.");
	}

	getFiles() {
		throw new TypeError("getFiles method has to be implemented.");
	}

	deleteFile() {
		throw new TypeError("deleteFile method has to be implemented.");
	}

	generateSignedUrl() {
		throw new TypeError("generateSignedUrl method has to be implemented.");
	}

	createDirectory() {
		throw new TypeError("createDirectory method has to be implemented.");
	}
}

module.exports = AbstractFileStorageStrategy;
