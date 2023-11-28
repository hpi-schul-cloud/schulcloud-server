import { ObjectId } from 'bson';
import { CommonCartridgeVersion } from './common-cartridge.enums';
import { CommonCartridgeElement } from './interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from './interfaces/common-cartridge-resource.interface';

export function createIdentifier(id?: string | ObjectId): string {
	id = id ?? new ObjectId();

	return `i${id.toString()}`;
}

export function createVersionNotSupportedError(version: CommonCartridgeVersion): Error {
	return new Error(`Version ${version} is not supported`);
}

export function checkCommonCartridgeVersion(version: CommonCartridgeVersion): void | never {
	const supportedVersions = [CommonCartridgeVersion.V_1_1, CommonCartridgeVersion.V_1_3];

	if (supportedVersions.includes(version)) {
		return;
	}

	throw createVersionNotSupportedError(version);
}

export function checkForNullOrUndefined<T>(value: T | undefined | null, name: string): T | never {
	if (value) {
		return value;
	}

	throw new Error(`${name} is null or undefined`);
}

export function isCommonCartridgeElement(element: unknown): element is CommonCartridgeElement {
	return (
		(element as CommonCartridgeElement).getManifestXml !== undefined &&
		typeof (element as CommonCartridgeElement).getManifestXml === 'function'
	);
}

export function isCommonCartridgeElementArray(elements: unknown[]): elements is CommonCartridgeElement[] {
	return elements.every((element) => isCommonCartridgeElement(element));
}

export function isCommonCartridgeResource(element: unknown): element is CommonCartridgeResource {
	return (
		isCommonCartridgeElement(element) &&
		(element as CommonCartridgeResource).canInline !== undefined &&
		typeof (element as CommonCartridgeResource).canInline === 'function' &&
		(element as CommonCartridgeResource).getFilePath !== undefined &&
		typeof (element as CommonCartridgeResource).getFilePath === 'function' &&
		(element as CommonCartridgeResource).getFileContent !== undefined &&
		typeof (element as CommonCartridgeResource).getFileContent === 'function'
	);
}

export function isCommonCartridgeResourceArray(elements: unknown[]): elements is CommonCartridgeResource[] {
	return elements.every((element) => isCommonCartridgeResource(element));
}
