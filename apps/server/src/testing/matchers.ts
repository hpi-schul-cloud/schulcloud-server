/**
 * ISO 8601 date string regex pattern for use with expect.stringMatching()
 * Matches strings like: "2024-01-15T10:30:00.000Z" or "2024-01-15T10:30:00Z"
 */
export const ISO_DATE_STRING = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

/**
 * Helper to match ISO 8601 date strings in Jest expectations.
 *
 * @example
 * expect(response.body).toEqual({
 *   createdAt: expectIsoDateString(),
 *   updatedAt: expectIsoDateString(),
 * });
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const expectIsoDateString = (): ReturnType<typeof expect.stringMatching> =>
	expect.stringMatching(ISO_DATE_STRING);
