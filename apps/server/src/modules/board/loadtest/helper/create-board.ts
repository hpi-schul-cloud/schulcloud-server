import { BoardExternalReferenceType, BoardLayout } from '../../domain';
import { sleep } from './sleep';

export class HttpError extends Error {
	constructor(public readonly status: number, public readonly statusText: string) {
		super(`HTTP Error ${status}: ${statusText}`);
	}
}

export const createBoard = async (apiBaseUrl: string, token: string, courseId: string) => {
	const boardTitle = `${new Date().toISOString().substring(0, 10)} ${new Date().toLocaleTimeString(
		'de-DE'
	)} - Lasttest`;

	const response = await fetch(`${apiBaseUrl}/api/v3/boards`, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			accept: 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			title: boardTitle,
			parentId: courseId,
			parentType: BoardExternalReferenceType.Course,
			layout: BoardLayout.COLUMNS,
		}),
	});

	if (response.status !== 201) {
		throw new HttpError(response.status, response.statusText);
	}
	const body = (await response.json()) as unknown as { id: string };
	return body.id;
};

export const createBoardsResilient = async (apiBaseUrl: string, token: string, courseId: string, amount: number) => {
	const boardIds: string[] = [];
	let retries = 0;
	while (boardIds.length < amount && retries < 10) {
		try {
			// eslint-disable-next-line no-await-in-loop
			const boardId = await createBoard(apiBaseUrl, token, courseId);
			boardIds.push(boardId);
		} catch (err) {
			if ('status' in err) {
				const { status } = err as unknown as HttpError;
				if (status === 401) {
					throw new Error('Unauthorized REST-Api access - check token, url and courseId in environment variables.');
				}
			}
			retries += 1;
			// eslint-disable-next-line no-await-in-loop
			await sleep(100);
		}
	}
	return boardIds;
};
