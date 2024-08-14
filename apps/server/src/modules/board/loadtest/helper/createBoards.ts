import { BoardExternalReferenceType, BoardLayout } from '../../domain';

export const createBoard = async (apiBaseUrl: string, token: string, courseId: string) => {
	console.log('apiBaseUrl', apiBaseUrl);
	console.log('courseId', courseId);
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
		throw new Error(`Failed to create board: ${response.status} - check token and target in env-variables`);
	}
	const body = (await response.json()) as unknown as { id: string };
	return body.id;
};

export const createBoards = async (apiBaseUrl: string, token: string, courseId: string, amount: number) => {
	const promises = Array(amount)
		.fill(1)
		.map(() => createBoard(apiBaseUrl, token, courseId));
	const results = await Promise.all(promises);
	return results;
};
