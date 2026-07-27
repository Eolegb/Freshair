import "server-only"

type LogLevel = "info" | "warn" | "error"

function formatLog(level: LogLevel, message: string, data?: unknown) {
	const timestamp = new Date().toISOString()
	const metadata = data ? JSON.stringify(data, null, 2) : ""
	return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metadata}`
}

export const logger = {
	info(message: string, data?: unknown) {
		console.log(formatLog("info", message, data))
	},

	warn(message: string, data?: unknown) {
		console.warn(formatLog("warn", message, data))
	},

	error(message: string, data?: unknown) {
		console.error(formatLog("error", message, data))
	}
}
