#!/usr/bin/env node

/**
 * createRooms.util.js
 *
 * A utility script to create many rooms with members via REST API on a locally running instance.
 * This reproduces the original GET /rooms/stats incident (MongoDB error 10334, BSONObjectTooLarge),
 * which was caused by the room-membership aggregation joining full user documents for every room
 * member instead of just checking school membership. All created rooms will be named
 * "Loadtest Room <n>", member users will have firstName "Loadtest".
 *
 * Usage: node scripts/createRooms.util.js
 *
 * Prerequisites:
 * - A valid JWT token from an administrator account (permission SCHOOL_ADMINISTRATE_ROOMS)
 * - The base URL of the API server
 */

const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const ROOM_COLORS = [
	'blue-grey',
	'pink',
	'red',
	'orange',
	'yellow',
	'olive',
	'green',
	'turquoise',
	'light-blue',
	'blue',
	'magenta',
	'purple',
	'brown',
];

/**
 * Prompts the user for input
 * @param {string} question - The question to ask
 * @returns {Promise<string>} - The user's response
 */
function prompt(question) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer.trim());
		});
	});
}

function displayInfo() {
	console.log('');
	console.log('='.repeat(70));
	console.log('              CREATE ROOMS UTILITY SCRIPT');
	console.log('='.repeat(70));
	console.log('');
	console.log('This script allows you to:');
	console.log('  1. Create many rooms via the REST API on your local school');
	console.log('  2. Auto-create member users and add them to every created room');
	console.log('');
	console.log('Use this to test GET /rooms/stats with a large number of rooms and members.');
	console.log('On the unfixed code, enough rooms x members will make the aggregation result');
	console.log('exceed the 16MB BSON limit (error code 10334). On the fixed code, only a');
	console.log('minimal school-membership check is kept in the pipeline, so it should succeed.');
	console.log('');
	console.log('Requirements:');
	console.log('  - A valid JWT token of a school administrator');
	console.log('  - The user must have permission to administrate rooms');
	console.log('='.repeat(70));
	console.log('');
}

/**
 * Creates axios instances for API v1 (user creation) and v3 (rooms)
 * @param {string} baseUrl - The API base URL (without port)
 * @param {string} jwt - The JWT token
 * @returns {{v1Api: import('axios').AxiosInstance, v3Api: import('axios').AxiosInstance}}
 */
function createApiClients(baseUrl, jwt) {
	const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
	const isLocalhost = normalizedBaseUrl.includes('localhost') || normalizedBaseUrl.includes('127.0.0.1');
	const apiV1PortSuffix = isLocalhost ? ':3030' : '';
	const apiV3PortSuffix = isLocalhost ? ':4000' : '';

	const headers = {
		Authorization: `Bearer ${jwt}`,
		'Content-Type': 'application/json',
	};

	const v1Api = axios.create({ baseURL: `${normalizedBaseUrl}${apiV1PortSuffix}/api/v1`, headers });
	const v3Api = axios.create({ baseURL: `${normalizedBaseUrl}${apiV3PortSuffix}/api/v3`, headers });

	return { v1Api, v3Api };
}

/**
 * Fetches the current user's information
 * @param {import('axios').AxiosInstance} v3Api
 * @returns {Promise<{schoolId: string, userId: string}>}
 */
async function getCurrentUserInfo(v3Api) {
	try {
		const response = await v3Api.get('/me');
		return {
			schoolId: response.data.school.id,
			userId: response.data._id,
		};
	} catch (error) {
		if (error.response) {
			throw new Error(`Failed to get user info: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
		}
		throw new Error(`Failed to get user info: ${error.message}`);
	}
}

/**
 * Creates a single member user, mirroring createUsers.util.js
 * @param {import('axios').AxiosInstance} v1Api
 * @param {string} schoolId
 * @param {string} teacherRoleId
 * @param {number} index
 * @returns {Promise<{userId: string, email: string}>}
 */
async function createMemberUser(v1Api, schoolId, teacherRoleId, index) {
	const uniqueId = `${Date.now()}_${index}`;
	const email = `loadtest_${uniqueId}@example.com`;

	try {
		const response = await v1Api.post('/users', {
			firstName: 'Loadtest',
			lastName: `Member_${uniqueId}`,
			email,
			schoolId,
			roles: [teacherRoleId],
		});
		return { userId: response.data._id, email };
	} catch (error) {
		if (error.response) {
			throw new Error(`Failed to create member user: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
		}
		throw new Error(`Failed to create member user: ${error.message}`);
	}
}

/**
 * Creates a single room
 * @param {import('axios').AxiosInstance} v3Api
 * @param {string} namePrefix
 * @param {number} index
 * @returns {Promise<{roomId: string, name: string}>}
 */
async function createRoom(v3Api, namePrefix, index) {
	const name = `${namePrefix} ${index}`;
	const color = ROOM_COLORS[index % ROOM_COLORS.length];

	try {
		const response = await v3Api.post('/rooms', { name, color });
		return { roomId: response.data.id, name };
	} catch (error) {
		if (error.response) {
			throw new Error(`Failed to create room: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
		}
		throw new Error(`Failed to create room: ${error.message}`);
	}
}

/**
 * Adds existing users to a room as members
 * @param {import('axios').AxiosInstance} v3Api
 * @param {string} roomId
 * @param {string[]} userIds
 * @returns {Promise<void>}
 */
async function addUsersToRoom(v3Api, roomId, userIds) {
	try {
		await v3Api.patch(`/rooms/${roomId}/members/add`, { userIds });
	} catch (error) {
		if (error.response) {
			throw new Error(`Failed to add members: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
		}
		throw new Error(`Failed to add members: ${error.message}`);
	}
}

/**
 * Runs async tasks with a limited concurrency, preserving input order in the results.
 * @template T
 * @param {Array<() => Promise<T>>} tasks
 * @param {number} concurrency
 * @returns {Promise<Array<{ status: 'fulfilled', value: T } | { status: 'rejected', reason: Error }>>}
 */
async function runWithConcurrency(tasks, concurrency) {
	const results = new Array(tasks.length);
	let nextIndex = 0;

	async function worker() {
		while (nextIndex < tasks.length) {
			const currentIndex = nextIndex;
			nextIndex += 1;
			try {
				const value = await tasks[currentIndex]();
				results[currentIndex] = { status: 'fulfilled', value };
			} catch (error) {
				results[currentIndex] = { status: 'rejected', reason: error };
			}
		}
	}

	const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
	await Promise.all(workers);

	return results;
}

async function createRooms(roomCount, namePrefix, memberUserIds, v3Api, concurrency) {
	let completed = 0;
	const tasks = Array.from({ length: roomCount }, (_, index) => async () => {
		const room = await createRoom(v3Api, namePrefix, index + 1);

		if (memberUserIds.length > 0) {
			await addUsersToRoom(v3Api, room.roomId, memberUserIds);
		}

		completed += 1;
		console.log(`[${completed}/${roomCount}] Created room: ${room.name} (ID: ${room.roomId})`);

		return room;
	});

	const results = await runWithConcurrency(tasks, concurrency);

	const createdRooms = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
	const errors = results
		.map((r, index) => ({ result: r, index }))
		.filter(({ result }) => result.status === 'rejected')
		.map(({ result, index }) => ({ index, error: result.reason.message }));

	console.log('\n' + '-'.repeat(70));
	console.log(`Successfully created ${createdRooms.length} out of ${roomCount} rooms.`);

	return { createdRooms, errors };
}

/**
 * Calls GET /rooms/stats to check whether the aggregation still fails with BSONObjectTooLarge.
 * @param {import('axios').AxiosInstance} v3Api
 * @returns {Promise<void>}
 */
async function printRoomStatsSample(v3Api) {
	console.log('\nCalling GET /rooms/stats to reproduce/verify the original incident...');
	try {
		const start = Date.now();
		const response = await v3Api.get('/rooms/stats', { params: { skip: 0, limit: 500 } });
		const durationMs = Date.now() - start;
		console.log(`SUCCESS in ${durationMs}ms: total=${response.data.total}, page size=${response.data.data.length}.`);
	} catch (error) {
		if (error.response) {
			const body = JSON.stringify(error.response.data);
			console.error(`FAILED: ${error.response.status} - ${body}`);
			if (body.includes('10334') || body.includes('BSONObjectTooLarge')) {
				console.error('This is the original incident: the aggregation result exceeded the 16MB BSON limit.');
			}
		} else {
			console.error(`FAILED: ${error.message}`);
		}
	}
}

async function main() {
	displayInfo();

	try {
		const baseUrl = (await prompt('Enter the API base URL (e.g., http://localhost): ')) || 'http://localhost';
		if (!baseUrl) {
			console.error('Error: Base URL is required.');
			process.exit(1);
		}

		const jwt = await prompt('Enter your JWT token of a school administrator: ');
		if (!jwt) {
			console.error('Error: JWT token is required.');
			process.exit(1);
		}

		const { v1Api, v3Api } = createApiClients(baseUrl, jwt);

		console.log('\nValidating JWT and fetching user info...');
		const userInfo = await getCurrentUserInfo(v3Api);
		console.log(`Authenticated successfully. SchoolId: ${userInfo.schoolId}`);

		const roomCountStr = await prompt('\nHow many rooms should be created? ');
		const roomCount = parseInt(roomCountStr, 10);
		if (isNaN(roomCount) || roomCount <= 0) {
			console.error('Error: Please enter a valid positive number.');
			process.exit(1);
		}

		const namePrefix = (await prompt('Room name prefix (default: "Loadtest Room"): ')) || 'Loadtest Room';

		// A member pool shared across all rooms reproduces the original incident: the old
		// pipeline joined a full user document per room per member, so rooms x pool size is
		// what determines the aggregated result size, not any single user's document size.
		const memberPoolSizeStr = await prompt(
			'\nHow many member users should be created and added to every room (default: 50, 0 to skip)? '
		);
		const memberPoolSize = memberPoolSizeStr === '' ? 50 : parseInt(memberPoolSizeStr, 10) || 0;

		let memberUserIds = [];
		if (memberPoolSize > 0) {
			const teacherRoleId =
				(await prompt('Teacher role ID (default: 0000d186816abba584714c98): ')) || '0000d186816abba584714c98';

			console.log(`\nCreating ${memberPoolSize} member users...`);
			for (let i = 0; i < memberPoolSize; i += 1) {
				const member = await createMemberUser(v1Api, userInfo.schoolId, teacherRoleId, i);
				memberUserIds.push(member.userId);
				console.log(`[${i + 1}/${memberPoolSize}] Created member user: ${member.email}`);
			}
		} else {
			const memberUserIdsInput = await prompt(
				'\nComma-separated existing user IDs to add as members to every room (press Enter to skip): '
			);
			memberUserIds = memberUserIdsInput
				? memberUserIdsInput
						.split(',')
						.map((id) => id.trim())
						.filter(Boolean)
				: [];
		}

		const concurrencyStr = await prompt('\nHow many rooms to create in parallel (default: 5): ');
		const concurrency = parseInt(concurrencyStr, 10) || 5;

		console.log('\n' + '-'.repeat(70));
		console.log(`Creating ${roomCount} rooms with concurrency ${concurrency}...`);
		console.log('-'.repeat(70));

		const { createdRooms, errors } = await createRooms(roomCount, namePrefix, memberUserIds, v3Api, concurrency);

		await printRoomStatsSample(v3Api);

		console.log('\n' + '='.repeat(70));
		console.log('                         SUMMARY');
		console.log('='.repeat(70));
		console.log(`Total rooms requested:  ${roomCount}`);
		console.log(`Successfully created:   ${createdRooms.length}`);
		console.log(`Failed:                 ${errors.length}`);
		if (memberUserIds.length > 0) {
			console.log(`Members added per room: ${memberUserIds.length}`);
		}
		console.log('');

		if (errors.length > 0) {
			console.log('\nErrors:');
			errors.forEach((err) => {
				console.log(`  Room ${err.index + 1}: ${err.error}`);
			});
		}

		console.log('\n' + '='.repeat(70));
	} catch (error) {
		console.error(`\nError: ${error.message}`);
		process.exit(1);
	} finally {
		rl.close();
	}
}

main();
