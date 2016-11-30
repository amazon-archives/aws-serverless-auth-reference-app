'use strict';
class LambdaError {
  constructor(statusCode, message, type) {
    this.statusCode = statusCode;
    this.message = message;
    this.type = type;
  }

  static internalError(err) {
    return new LambdaError(500, err.message, 'internalError');
  }

  static notFound(obj) {
    return new LambdaError(404, `The object ${obj} is not found`, 'notFound');
  }

  static putDataFailed(err) {
    return new LambdaError(500, err.message, 'putFailed');
  }

  static deleteDataFailed(err) {
    return new LambdaError(500, err.message, 'deleteFailed');
  }

  toLambda() {
    return {
      statusCode: this.statusCode,
      body: JSON.stringify({
        message: this.message,
        type: this.type
      })
    }
  }
}

module.exports = LambdaError;
