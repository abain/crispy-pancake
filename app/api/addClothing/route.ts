import { NextResponse } from 'next/server';
import closetManager from '@/lib/closetManager';
import type { ClothingItem } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ClothingItem>;

    // Validate required string fields
    const requiredStrings: (keyof ClothingItem)[] = ['name', 'category', 'color', 'colorFamily'];
    for (const field of requiredStrings) {
      const val = body[field];
      if (val === undefined || val === null || val === '') {
        return NextResponse.json(
          { error: `Field "${field}" is required` },
          { status: 400 },
        );
      }
    }
    // Validate formality: must be a number between 1 and 5
    const formality = Number(body.formality);
    if (isNaN(formality) || formality < 1 || formality > 5) {
      return NextResponse.json(
        { error: 'Field "formality" must be a number between 1 and 5' },
        { status: 400 },
      );
    }
    // style is optional (defaults to []); validate it's an array if provided
    if (body.style !== undefined && !Array.isArray(body.style)) {
      return NextResponse.json(
        { error: 'Field "style" must be an array of strings' },
        { status: 400 },
      );
    }

    const item = closetManager.addItem({
      name: body.name!,
      category: body.category!,
      subcategory: body.subcategory,
      color: body.color!,
      colorFamily: body.colorFamily!,
      style: body.style ?? [],
      formality: Number(body.formality),
      weatherSuitability: body.weatherSuitability ?? {},
      imageUrl: body.imageUrl,
      isDefault: false,
      isDirty: false,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error('[/api/addClothing] Error:', err);
    return NextResponse.json(
      { error: 'Failed to add clothing item' },
      { status: 500 },
    );
  }
}
