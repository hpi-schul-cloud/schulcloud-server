const removeLeadingSlash = path => path[0] === '/' ? path.substring(1) : path;

const generateFileNameSuffix = fileName => `${Date.now()}-${fileName}`;

const returnFileType = (fileName) => {
	return {
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		ppt: 'application/vnd.ms-powerpoint',
		xls: 'application/vnd.ms-excel',
		doc: 'application/vnd.ms-word',
		odt: 'application/vnd.oasis.opendocument.text',
		txt: 'text/plain',
		pdf: 'application/pdf'
	}[fileName.split('.').pop()];
};

module.exports  = {
	removeLeadingSlash,
	generateFileNameSuffix,
	returnFileType
};
