import { Platform } from 'react-native';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private static instance: Logger;
    private logs: string[] = [];
    private maxLogs = 100;

    private constructor() { }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(level: LogLevel, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        const platform = Platform.OS;
        let formattedMessage = `[${timestamp}] [${platform.toUpperCase()}] [${level.toUpperCase()}] ${message}`;
        if (data) {
            try {
                formattedMessage += ` | Data: ${JSON.stringify(data)}`;
            } catch (e) {
                formattedMessage += ` | Data: [Unserializable Object]`;
            }
        }
        return formattedMessage;
    }

    private addLog(formattedMessage: string) {
        this.logs.push(formattedMessage);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    info(message: string, data?: any) {
        const formatted = this.formatMessage('info', message, data);
        console.log(formatted);
        this.addLog(formatted);
    }

    warn(message: string, data?: any) {
        const formatted = this.formatMessage('warn', message, data);
        console.warn(formatted);
        this.addLog(formatted);
    }

    error(message: string, data?: any) {
        const formatted = this.formatMessage('error', message, data);
        console.error(formatted);
        this.addLog(formatted);
    }

    debug(message: string, data?: any) {
        if (__DEV__) {
            const formatted = this.formatMessage('debug', message, data);
            console.log(formatted);
            this.addLog(formatted);
        }
    }

    getLogs(): string[] {
        return [...this.logs];
    }

    clearLogs() {
        this.logs = [];
    }
}

export const logger = Logger.getInstance();
