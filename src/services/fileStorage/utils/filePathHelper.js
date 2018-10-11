const removeLeadingSlash = path => {
	if (path[0] === '/') path = path.substring(1);
	return path;
};

const generateFileNameSuffix = fileName => {
	let currentTimeStamp = Date.now();
	return `${currentTimeStamp}-${fileName}`;
};

const fileTypes = {
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	ppt: 'application/vnd.ms-powerpoint',
	xls: 'application/vnd.ms-excel',
	doc: 'application/vnd.ms-word',
	odt: 'application/vnd.oasis.opendocument.text',
	txt: 'text/plain',
	pdf: 'application/pdf'
};

const returnFileType = fileName => {
	let fType = fileName.split('.');
	return fileTypes[fType[fType.length - 1]];
};

module.exports  = {
	removeLeadingSlash,
	generateFileNameSuffix,
	returnFileType
};
