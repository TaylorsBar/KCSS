import { configService } from './configService';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

class LoggingService {
    private postLogs(level: LogLevel, message: string, context: object = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            // TODO: Add session ID, user ID, app version, etc.
        };

        // In a browser environment, we log to the console.
        // In a real app, this would send logs to an observability platform.
        switch (level) {
            case 'INFO':
                console.log(JSON.stringify(logEntry, null, 2));
                break;
            case 'WARN':
                console.warn(JSON.stringify(logEntry, null, 2));
                break;
            case 'ERROR':
                console.error(JSON.stringify(logEntry, null, 2));
                break;
            case 'DEBUG':
                console.debug(JSON.stringify(logEntry, null, 2));
                break;
        }

        const endpoint = configService.get('observability').endpoint;
        if (endpoint) {
            // TODO: Implement fetch to send logs to the observability endpoint.
            // Use navigator.sendBeacon for resilience against page unloads.
        }
    }
    
    info(message: string, context?: object) {
        this.postLogs('INFO', message, context);
    }

    warn(message: string, context?: object) {
        this.postLogs('WARN', message, context);
    }
    
    error(message: string, context?: object) {
        this.postLogs('ERROR', message, context);
    }
}

export const loggingService = new LoggingService();
