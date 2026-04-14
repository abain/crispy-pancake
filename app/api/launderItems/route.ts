import { NextResponse } from 'next/server';
import closetManager from '@/lib/closetManager';

/**
 * POST /api/launderItems
 * Marks all clothing items as clean, resetting the wardrobe for a new week.
 * Optionally accepts { ids: string[] } to launder specific items only.
 */
export async function POST(request: Request) {
  try {
    let ids: string[] | undefined;

    // Body is optional – if absent, launder everything
    const text = await request.text();
    if (text.trim()) {
      const body = JSON.parse(text) as { ids?: string[] };
      ids = body.ids;
    }

    if (ids && ids.length > 0) {
      closetManager.markClean(ids);
    } else {
      closetManager.launderAll();
    }

    const updated = closetManager.getAll();
    return NextResponse.json({ success: true, cleanCount: updated.filter((i) => !i.isDirty).length });
  } catch (err) {
    console.error('[/api/launderItems] Error:', err);
    return NextResponse.json(
      { error: 'Failed to launder items' },
      { status: 500 },
    );
  }
}
