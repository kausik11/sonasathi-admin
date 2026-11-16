import { GET as getIbjaRate } from "../gold-rates/ibja/route";

// Keep the original endpoint as a compatibility alias for older local clients.
export async function POST() {
  return getIbjaRate();
}
