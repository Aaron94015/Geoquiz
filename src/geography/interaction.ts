export type Point = { x: number; y: number };
export type ViewTransform = Point & { scale: number };

export const MIN_SCALE = 1;
export const MAX_SCALE = 8;
export const TAP_SLOP = 7;

export function constrainTransform(transform: ViewTransform, width: number, height: number): ViewTransform {
  const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale));
  const limitX = (width * (scale - 1)) / 2;
  const limitY = (height * (scale - 1)) / 2;
  return { scale, x: Math.max(-limitX, Math.min(limitX, transform.x)), y: Math.max(-limitY, Math.min(limitY, transform.y)) };
}

export function movedBeyondTap(start: Point, end: Point) {
  return Math.hypot(end.x - start.x, end.y - start.y) > TAP_SLOP;
}

export function isDeliberateTap(activePointers: number, moved: boolean, pinched: boolean) {
  return activePointers === 1 && !moved && !pinched;
}

export function resolveCountryHit<T>(actual: T | undefined, helpers: readonly { item: T; distance: number }[], radius = 22) {
  if (actual) return actual;
  return helpers.filter((helper) => helper.distance <= radius).sort((a, b) => a.distance - b.distance)[0]?.item;
}
