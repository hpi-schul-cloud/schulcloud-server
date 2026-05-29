/* eslint-disable no-console */
export enum LogLevel {
	NORMAL = 0,
	VERBOSE = 1,
}

export const LogSymbol = {
	SUCCESS: '✓',
	FAILURE: '✗',
	SKIP: '→',
	WARNING: '⚠',
	INFO: '•',
	ARROW: '→',
} as const;

export class H5pLogger {
	private indentLevel = 0;
	private readonly indentSize = 2;
	private logLevel: LogLevel = LogLevel.NORMAL;

	public setLogLevel(level: LogLevel): void {
		this.logLevel = level;
	}

	public getLogLevel(): LogLevel {
		return this.logLevel;
	}

	public indent(): void {
		this.indentLevel += 1;
	}

	public dedent(): void {
		if (this.indentLevel > 0) {
			this.indentLevel -= 1;
		}
	}

	public resetIndent(): void {
		this.indentLevel = 0;
	}

	private getIndent(): string {
		return ' '.repeat(this.indentLevel * this.indentSize);
	}

	public log(message: string): void {
		if (this.logLevel >= LogLevel.NORMAL) {
			console.log(`${this.getIndent()}${message}`);
		}
	}

	public debug(message: string): void {
		if (this.logLevel >= LogLevel.VERBOSE) {
			console.log(`${this.getIndent()}${message}`);
		}
	}

	public success(message: string): void {
		this.log(`${LogSymbol.SUCCESS} ${message}`);
	}

	public failure(message: string): void {
		this.log(`${LogSymbol.FAILURE} ${message}`);
	}

	public skip(message: string): void {
		this.log(`${LogSymbol.SKIP} ${message}`);
	}

	public warn(message: string): void {
		this.log(`${LogSymbol.WARNING} ${message}`);
	}

	public info(message: string): void {
		this.log(`${LogSymbol.INFO} ${message}`);
	}

	public error(message: string): void {
		console.error(`${this.getIndent()}${LogSymbol.FAILURE} ${message}`);
	}

	public banner(title: string): void {
		const line = '═'.repeat(title.length + 4);
		console.log('');
		console.log(line);
		console.log(`  ${title}`);
		console.log(line);
	}

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

	public formatLibraryList(libraries: Set<string> | string[]): string {
		const arr = Array.isArray(libraries) ? libraries : Array.from(libraries);
		if (arr.length === 0) return '(none)';
		const sorted = [...arr].sort((a, b) => a.localeCompare(b));
		return sorted.join(', ');
	}

	public action(action: string, target: string): void {
		this.log(`${action} ${target}...`);
	}

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

export const h5pLogger = new H5pLogger();
