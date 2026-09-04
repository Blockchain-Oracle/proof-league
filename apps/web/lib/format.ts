/// A short, quotable address: the first six and last four characters, as every seat
/// prints it. Kept out of any "use client" module so server pages can use it too.
export const shortAddress = (address: string): string => `${address.slice(0, 6)}…${address.slice(-4)}`;
