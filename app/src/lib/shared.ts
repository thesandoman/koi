import { visibleSharedPins } from "@/rules/pinky-core";

/** Only the overlap of two pin lists is ever returned, and only for a mutual pair. */
export const sharedPlaceKeys = (a: string[], b: string[]) => visibleSharedPins(a, b);
