/* eslint-disable no-console */
/**
 * Log levels for controlling output verbosity
 */
export enum LogLevel {
	/** Normal output (default) */
	NORMAL = 0,
	/** Verbose output including debug messages */
	VERBOSE = 1,
}

/**
 * Log symbols for consistent visual feedback
 */
export const LogSymbol = {
	SUCCESS: '✓',
	FAILURE: '✗',
	SKIP: '→',
	WARNING: '⚠',
	INFO: '•',
	ARROW: '→',
} as const;

/**
 * Helper class for structured, hierarchical logging in H5P package operations.
 * Provides consistent indentation, symbols, and formatting for build output.
 */
export class H5pLogger {
	private indentLevel = 0;
	private readonly indentSize = 2;
	private logLevel: LogLevel = LogLevel.NORMAL;

	/**
	 * Set the log level
	 */
	public setLogLevel(level: LogLevel): void {
		this.logLevel = level;
	}

	/**
	 * Get the current log level
	 */
	public getLogLevel(): LogLevel {
		return this.logLevel;
	}

	/**
	 * Increase indentation level for nested operations
	 */
	public indent(): void {
		this.indentLevel += 1;
	}

	/**
	 * Decrease indentation level
	 */
	public dedent(): void {
		if (this.indentLevel > 0) {
			this.indentLevel -= 1;
		}
	}

	/**
	 * Reset indentation to root level
	 */
	public resetIndent(): void {
		this.indentLevel = 0;
	}

	/**
	 * Get current indentation string
	 */
	private getIndent(): string {
		return ' '.repeat(this.indentLevel * this.indentSize);
	}

	/**
	 * Log a message with current indentation
	 */
	public log(message: string): void {
		if (this.logLevel >= LogLevel.NORMAL) {
			console.log(`${this.getIndent()}${message}`);
		}
	}

	/**
	 * Log a debug message (only shown in verbose mode)
	 */
	public debug(message: string): void {
		if (this.logLevel >= LogLevel.VERBOSE) {
			console.log(`${this.getIndent()}${message}`);
		}
	}

	/**
	 * Log a success message
	 */
	public success(message: string): void {
		this.log(`${LogSymbol.SUCCESS} ${message}`);
	}

	/**
	 * Log a failure message
	 */
	public failure(message: string): void {
		this.log(`${LogSymbol.FAILURE} ${message}`);
	}

	/**
	 * Log a skip message (item already available)
	 */
	public skip(message: string): void {
		this.log(`${LogSymbol.SKIP} ${message}`);
	}

	/**
	 * Log a warning message
	 */
	public warn(message: string): void {
		this.log(`${LogSymbol.WARNING} ${message}`);
	}

	/**
	 * Log an info message
	 */
	public info(message: string): void {
		this.log(`${LogSymbol.INFO} ${message}`);
	}

	/**
	 * Log an error to stderr
	 */
	public error(message: string): void {
		console.error(`${this.getIndent()}${LogSymbol.FAILURE} ${message}`);
	}

	/**
	 * Print a section header banner
	 */
	public banner(title: string): void {
		const line = '═'.repeat(title.length + 4);
		console.log('');
		console.log(line);
		console.log(`  ${title}`);
		console.log(line);
	}

	/**
	 * Print a summary section
	 */
	public summary(title: string, items: { label: string; value: string | number }[]): void {
		console.log('');
		const line = '─'.repeat(40);
		console.log(line);
		console.log(`  ${title}`);
		console.log(line);
		for (const item of items) {
			console.log(`  ${item.label.padEnd(12)} ${item.value}`);
		}
		console.log(line);
	}

	/**
	 * Format a library list for display
	 */
	public formatLibraryList(libraries: Set<string> | string[]): string {
		const arr = Array.isArray(libraries) ? libraries : Array.from(libraries);
		if (arr.length === 0) return '(none)';
		const sorted = [...arr].sort((a, b) => a.localeCompare(b));
		return sorted.join(', ');
	}

	/**
	 * Log a build action (download, build, etc.)
	 */
	public action(action: string, target: string): void {
		this.log(`${action} ${target}...`);
	}

	/**
	 * Log dependency resolution
	 */
	public dependency(depName: string, resolved: string, status: 'built' | 'skipped' | 'failed'): void {
		let symbol: string;
		if (status === 'built') {
			symbol = LogSymbol.SUCCESS;
		} else if (status === 'skipped') {
			symbol = LogSymbol.SKIP;
		} else {
			symbol = LogSymbol.FAILURE;
		}
		const statusText = status === 'skipped' ? 'already available' : status;
		this.log(`${symbol} ${depName} ${LogSymbol.ARROW} ${resolved} (${statusText})`);
	}
}

// Singleton instance for convenience
export const h5pLogger = new H5pLogger();
