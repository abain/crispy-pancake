import { NextResponse } from 'next/server';
import closetManager from '@/lib/closetManager';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Query parameter "id" is required' },
        { status: 400 },
      );
    }

    const removed = closetManager.removeItem(id);
    if (!removed) {
      return NextResponse.json(
        { error: `Clothing item "${id}" not found` },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('[/api/deleteClothing] Error:', err);
    return NextResponse.json(
      { error: 'Failed to delete clothing item' },
      { status: 500 },
    );
  }
}
