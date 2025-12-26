export function lazyClient<T extends object>(factory: () => T): T {
  let instance: T | null = null;

  return new Proxy({} as T, {
    get(_target, prop) {
      if (!instance) {
        instance = factory();
      }

      // biome-ignore lint/suspicious/noExplicitAny: Dynamic property access requires any for proxy implementation
      const value = (instance as any)[prop];

      if (typeof value === 'function') {
        return value.bind(instance);
      }

      return value;
    },
  });
}
