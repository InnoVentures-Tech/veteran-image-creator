import type { ImageTemplate } from "./studio/engine";
import { veteranIlk11 } from "./studio/veteran-ilk-11";
import { veteranKampKadrosu } from "./studio/veteran-kamp-kadrosu";
import { veteranMacGunu } from "./studio/veteran-mac-gunu";
import { veteranMacSonucu } from "./studio/veteran-mac-sonucu";

// Safranboluspor panelindeki "Berkay Özel" grubunun şablonları (src/studio, scripts/sync.mjs ile güncellenir)
export const TEMPLATES: ImageTemplate[] = [veteranIlk11, veteranKampKadrosu, veteranMacGunu, veteranMacSonucu];
