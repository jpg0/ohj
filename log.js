const LOGGER_PREFIX = "script.js";

class Logger {
    constructor(_name, _listener) {
        this._name = _name || this._getCallerDetails("", 3).fileName.replace(/\.[^/.]+$/, "")
        this._listener = _listener;
        this._logger = Java.type("org.slf4j.LoggerFactory").getLogger(LOGGER_PREFIX + "." + this.name.toString().toLowerCase());
    }

    _getCallerDetails (msg, ignoreStackDepth) {
        let stackLine = null;

        if(!(msg instanceof Error)) {
            msg = Error(msg);
            stackLine = msg.stack.split('\n')[ignoreStackDepth];
        } else {
            stackLine = msg.stack.split('\n')[1];
        }

        //pick out the call, fileName & lineNumber from the specific frame
        let match = stackLine.match(/^\s+at\s*(?<caller>[^ ]*) \(?(?<fileName>[^:]+):(?<lineNumber>[0-9]+):[0-9]+\)?/);

        if(match) {
            Object.assign(msg, match.groups);
        } else { //won't match an 'eval'd string, so retry
            match = stackLine.match(/\s+at\s+\<eval\>:(?<lineNumber>[0-9]+):[0-9]+/)
            if(match) {
                Object.assign(msg, {
                    fileName: "<unknown>",
                    caller: "<root script>"
                }, match.groups)
            } else throw Error(`Failed to parse stack line: ${stackLine}`);
        }

        return msg;
    }

    _formatLogMessage(msg, levelString, ignoreStackDepth, prefix = "log") {

        let clazz = this;
        let msgData = {
            message: msg.toString(),
            get caller() {//don't run this unless we need to, then cache it
                this.cached = this.cached || clazz._getCallerDetails(msg, ignoreStackDepth)
                return this.cached;
            }
        };

        levelString = levelString.toUpperCase();

        switch(prefix) {
            case "none": return msgData.message;
            case "level": return `[${levelString}] ${msgData.message}`
            case "short": return `${msgData.message}\t\t[${this.name}, ${msgData.caller.fileName}:${msgData.caller.lineNumber}]`
            case "log": return `${msgData.message}\t\t[${this.name} at source ${msgData.caller.fileName}, line ${msgData.caller.lineNumber}]`
            default: throw Error(`Unknown prefix type ${prefix}`)
        }
     }

    error() { this.atLevel('error', ...arguments)}
    warn() { this.atLevel('warn', ...arguments)}
    info() { this.atLevel('info', ...arguments)}
    debug() { this.atLevel('debug', ...arguments)}
    trace() { this.atLevel('trace', ...arguments)}

    atLevel(level, msg) {
        let titleCase = level[0].toUpperCase() + level.slice(1)
        try {
            if(this._logger[`is${titleCase}Enabled`]()) {
                this._logger[level](this._formatLogMessage(msg, level, 6), [].slice.call(arguments).slice(2));
                if(this._listener) {
                    this._listener(msg, level)
                }
            }
        } catch (err) {
            this._logger.error(this._formatLogMessage(err, "error", 0));
        }
    }

    get listener() { return this._listener }
    get name() { return this._name }
}

module.exports = function(_name, _listener) {
    return new Logger(_name, _listener);
}
