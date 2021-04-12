const removeLeadingSlash = (path) => (path[0] === '/' ? path.substring(1) : path);

const generateFileNameSuffix = (fileName) => {
	// eslint-disable-next-line no-useless-escape
	const newString = fileName.replace(/[';:=#*+\[\]~<{\\()}>§$%&|^£@±?!"`□\s]/g, '-');
	return `${Date.now()}-${newString.toLowerCase()}`;
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
	generateFileNameSuffix,
	returnFileType,
};
