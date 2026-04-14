import { NextResponse } from 'next/server';
import closetManager from '@/lib/closetManager';

export const dynamic = 'force-dynamic';

/**
 * GET /api/getCloset
 * Returns all clothing items currently in the wardrobe store.
 * Query params:
 *   - category: filter by ClothingCategory (optional)
 *   - cleanOnly: "true" to return only clean (non-dirty) items (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const cleanOnly = searchParams.get('cleanOnly') === 'true';

    let items = cleanOnly ? closetManager.getClean() : closetManager.getAll();

    if (category) {
      items = items.filter((i) => i.category === category);
    }

    return NextResponse.json({ items, count: items.length });
  } catch (err) {
    console.error('[/api/getCloset] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch closet' }, { status: 500 });
  }
}
