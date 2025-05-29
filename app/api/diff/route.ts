import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { createVisualDiff, generateDiffFilename } from '@/app/lib/diff';

export async function POST(req: NextRequest) {
  try {
    const { fileA, fileB } = await req.json();
    if (!fileA || !fileB) {
      return NextResponse.json({ error: 'Missing file names' }, { status: 400 });
    }

    const filePathA = path.join(process.cwd(), 'public', fileA);
    const filePathB = path.join(process.cwd(), 'public', fileB);

    const outputFilename = generateDiffFilename(fileA, fileB);
    const result = await createVisualDiff(filePathA, filePathB, outputFilename);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}