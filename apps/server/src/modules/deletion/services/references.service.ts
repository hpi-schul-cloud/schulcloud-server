import fs from 'fs';

export class ReferencesService {
	static loadFromTxtFile(filePath: string): string[] {
		let fileContent = fs.readFileSync(filePath).toString();

		// Replace all the CRLF occurrences with just a LF.
		fileContent = fileContent.replace(/\r\n/g, '\n');

		// Split the whole file content by a line feed (LF) char (\n).
		const fileLines = fileContent.split('\n');

		const references: string[] = [];

		// Iterate over all the file lines and if it contains a valid id (which is
		// basically any non-empty string), add it to the loaded references array.
		fileLines.forEach((fileLine) => {
			const reference = fileLine.trim();

			if (reference && reference.length > 0) {
				references.push(reference);
			}
		});

		return references;
	}
}
