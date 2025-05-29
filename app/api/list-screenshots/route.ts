import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const files = await readdir(publicDir);
    const pngs = files.filter(f => f.endsWith('.png'));
    return NextResponse.json({ files: pngs });
  } catch (error) {
    return NextResponse.json({ files: [], error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}