// https://github.com/necojackarc/extensible-custom-error?tab=MIT-1-ov-file

class CustomError extends Error {
  statusCode: number = 500;

  constructor(message?: string | Error, ...args: unknown[]) {
    let errorToWrap: Error | undefined;

    if (message instanceof Error) {
      errorToWrap = message;
    } else if (args[0] instanceof Error) {
      errorToWrap = args[0];
      args.shift();
    }

    super(message as string);

    // Align with Object.getOwnPropertyDescriptor(Error.prototype, "name")
    Object.defineProperty(this, "name", {
      configurable: true,
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    });

    const mergeStackTrace = (
      stackTraceToMerge: string,
      baseStackTrace: string | undefined,
    ): string => {
      if (!baseStackTrace) {
        return stackTraceToMerge;
      }

      const entriesToMerge = stackTraceToMerge.split("\n");
      const baseEntries = baseStackTrace.split("\n");

      const newEntries: string[] = [];

      entriesToMerge.forEach((entry) => {
        if (baseEntries.includes(entry)) {
          return;
        }
        newEntries.push(entry);
      });

      return [...newEntries, ...baseEntries].join("\n");
    };

    const stackTraceSoFar = errorToWrap ? errorToWrap.stack : undefined;

    if (Object.prototype.hasOwnProperty.call(Error, "captureStackTrace")) {
      Error.captureStackTrace(this, this.constructor);
      this.stack = mergeStackTrace(this.stack!, stackTraceSoFar);
      return;
    }

    const stackTraceEntries = new Error(message as string).stack!.split("\n");
    const stackTraceWithoutConstructors = [
      stackTraceEntries[0],
      ...stackTraceEntries.slice(3),
    ].join("\n");

    this.stack = mergeStackTrace(
      stackTraceWithoutConstructors,
      stackTraceSoFar,
    );
  }
}

// 入力値がない、不正
export class InputError extends CustomError {
  static {
    this.prototype.statusCode = 404;
  }
}

// 入力値が間違っている(値の形式は合っている)
export class InvalidValueError extends CustomError {
  static {
    this.prototype.statusCode = 400;
  }
}

// 認証されていない
export class AuthError extends CustomError {
  static {
    this.prototype.statusCode = 401;
  }
}

// 権限がない
export class ForbiddenError extends CustomError {
  static {
    this.prototype.statusCode = 403;
  }
}

// サーバーのエラーが発生
export class ServerError extends CustomError {
  static {
    this.prototype.statusCode = 500;
  }
}
