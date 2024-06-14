"use strict";

// https://github.com/necojackarc/extensible-custom-error?tab=MIT-1-ov-file

class CustomError extends Error {
  constructor(message, ...args){
    let errorToWrap;

    if(message instanceof Error){
      errorToWrap = message;
    }else if(args[0] instanceof Error){
      errorToWrap = args[0];
      args.shift();
    }

    super(message, ...args);

    // Align with Object.getOwnPropertyDescriptor(Error.prototype, "name")
    Object.defineProperty(this, "name", {
      configurable: true,
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    });

    const mergeStackTrace = (stackTraceToMerge, baseStackTrace) => {
      if(!baseStackTrace){
        return stackTraceToMerge;
      }

      const entriesToMerge = stackTraceToMerge.split("\n");
      const baseEntries = baseStackTrace.split("\n");

      const newEntries = [];

      entriesToMerge.forEach(entry => {
        if(baseEntries.includes(entry)){
          return;
        }
        newEntries.push(entry);
      });

      return [...newEntries, ...baseEntries].join("\n");
    };

    const stackTraceSoFar = errorToWrap ? errorToWrap.stack : undefined;

    if(Object.prototype.hasOwnProperty.call(Error, "captureStackTrace")){
      Error.captureStackTrace(this, this.constructor);
      this.stack = mergeStackTrace(this.stack, stackTraceSoFar);
      return;
    }

    const stackTraceEntries = new Error(message).stack.split("\n");
    const stackTraceWithoutConstructors
      = [stackTraceEntries[0], ...stackTraceEntries.slice(3)].join("\n");

    this.stack = mergeStackTrace(stackTraceWithoutConstructors, stackTraceSoFar);
  }
}


// 入力値がない、不正
class InputError extends CustomError {
  static {
    this.prototype.status = 404;
  }
}

// 入力値が間違っている(値の形式は合っている)
class InvalidValueError extends CustomError {
  static {
    this.prototype.status = 400;
  }
}

// 認証されていない
class AuthError extends CustomError {
  static {
    this.prototype.status = 401;
  }
}

// サーバーのエラーが発生
class ServerError extends CustomError {
  static {
    this.prototype.status = 500;
  }
}

exports.InputError = InputError;
exports.InvalidValueError = InvalidValueError;
exports.AuthError = AuthError;
exports.ServerError = ServerError;
