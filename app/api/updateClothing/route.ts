import { NextResponse } from 'next/server';
import closetManager from '@/lib/closetManager';
import type { ClothingItem } from '@/lib/types';

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<ClothingItem> & { id: string };

    if (!body.id) {
      return NextResponse.json(
        { error: 'Item id is required' },
        { status: 400 },
      );
    }

    const updated = closetManager.updateItem(body.id, body);
    if (!updated) {
      return NextResponse.json(
        { error: `Clothing item "${body.id}" not found` },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[/api/updateClothing] Error:', err);
    return NextResponse.json(
      { error: 'Failed to update clothing item' },
      { status: 500 },
    );
  }
}
