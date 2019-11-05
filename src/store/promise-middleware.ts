// Based on: https://github.com/acdlite/redux-promise/blob/master/src/index.js

function isPromise(val: any) {
  return val && typeof val.then === 'function';
}

export default function promiseMiddleware({ dispatch }: any) {
  return (next: any) => (action: any) => {
    if (isPromise(action.payload)) {
      dispatch({ ...action, payload: undefined });

      return action.payload.then(
        (result: any) => dispatch({ ...action, payload: result }),
        (error: Error) => dispatch({ ...action, payload: error, error: true })
      );
    } else {
      return next(action);
    }
  };
}
