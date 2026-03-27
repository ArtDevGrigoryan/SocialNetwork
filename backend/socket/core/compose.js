module.exports = function compose(...middlewares) {
  return async (socket, data) => {
    let index = -1;

    const dispatch = async (i) => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }

      index = i;

      const fn = middlewares[i];

      if (!fn) return;
      return fn(socket, data, () => dispatch(i + 1));
    };

    return dispatch(0);
  };
};
