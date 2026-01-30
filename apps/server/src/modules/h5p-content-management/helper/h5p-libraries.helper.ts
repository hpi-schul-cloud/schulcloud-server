import { InternalServerErrorException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { parse } from 'yaml';

interface LibrariesContentType {
	h5p_libraries: string[];
}

let libraryWhiteList: string[] | null = null;

const readWhitelistFromConfig = (filePath: string): string[] => {
	const librariesYamlContent = readFileSync(filePath, { encoding: 'utf-8' });
	const librariesContentType = castToLibrariesContentType(parse(librariesYamlContent));
	const libraryWhiteList = librariesContentType.h5p_libraries;

	return libraryWhiteList;
};

const castToLibrariesContentType = (object: unknown): LibrariesContentType => {
	if (!isLibrariesContentType(object)) {
		throw new InternalServerErrorException('Invalid input type for castToLibrariesContentType');
	}

	return object;
};

const isLibrariesContentType = (object: unknown): object is LibrariesContentType => {
	const isType =
		typeof object === 'object' &&
		!Array.isArray(object) &&
		object !== null &&
		'h5p_libraries' in object &&
		Array.isArray(object.h5p_libraries);

	return isType;
};

export const getLibraryWhiteList = (filePath: string): string[] => {
	if (libraryWhiteList === null) {
		libraryWhiteList = readWhitelistFromConfig(filePath);
	}

	return libraryWhiteList;
};

export const resetLibraryWhiteList = (): void => {
	libraryWhiteList = null;
};
