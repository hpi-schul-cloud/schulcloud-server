global.console = {
	...console,
	log: jest.fn(), // suppress console.log
	info: jest.fn(), // suppress console.info
	warn: jest.fn(), // suppress console.warn
	debug: jest.fn(), // suppress console.debug
	// error: console.error, // keep showing errors
};
