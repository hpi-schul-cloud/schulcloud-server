const removeLeadingSlash = (path) => (path[0] === '/' ? path.substring(1) : path);

const whitelistFileName = (fileName) => {
	// see https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html for valid characters
	// the regex below reduces allowed special chars to hyphen, underscore, period
	// eslint-disable-next-line no-useless-escape
	const result = fileName.replace(/[^0-9A-Za-z\-_.]+/g, '-').toLowerCase();
	return result;
};

const generateFileNameSuffix = (fileName) => {
	const whitelistedFileName = whitelistFileName(fileName);
	const now = Date.now();
	const result = `${now}-${whitelistedFileName}`;
	return result;
};

const returnFileType = (fileName) =>
	({
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		ppt: 'application/vnd.ms-powerpoint',
		xls: 'application/vnd.ms-excel',
		doc: 'application/vnd.ms-word',
		odt: 'application/vnd.oasis.opendocument.text',
		txt: 'text/plain',
		pdf: 'application/pdf',
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		jpe: 'image/jpeg',
		gif: 'image/gif',
		tiff: 'image/tiff',
		tif: 'image/tiff',
	}[fileName.split('.').pop()]);

module.exports = {
	removeLeadingSlash,
	whitelistFileName,
	generateFileNameSuffix,
	returnFileType,
};
