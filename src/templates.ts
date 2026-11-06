import type { ImageTemplate } from "./studio/engine";
import { veteranIlk11 } from "./studio/veteran-ilk-11";
import { veteranIlk11Xi } from "./studio/veteran-ilk-11-xi";
import { veteranKampKadrosu } from "./studio/veteran-kamp-kadrosu";
import { veteranMacGunu } from "./studio/veteran-mac-gunu";
import { veteranMacSonucu } from "./studio/veteran-mac-sonucu";

// Uygulamada sekme sekme gösterilen şablonlar (src/studio)
export const TEMPLATES: ImageTemplate[] = [veteranIlk11Xi, veteranIlk11, veteranKampKadrosu, veteranMacGunu, veteranMacSonucu];
