export function isTokenExpired(exp: number): boolean {
  const currentTime = Date.now() / 1000;
  return currentTime > exp;
}
