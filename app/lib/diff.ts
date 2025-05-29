import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export interface DiffResult {
  path: string;
  diffCount: number;
  totalPixels: number;
  diffPercentage: number;
}

export async function createVisualDiff(fileA: string, fileB: string, outputFilename: string): Promise<DiffResult> {
  // Read both images
  const imgA = PNG.sync.read(await readFile(fileA));
  const imgB = PNG.sync.read(await readFile(fileB));

  // Ensure both images are the same size
  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    throw new Error('Images must be the same size for comparison');
  }

  const { width, height } = imgA;
  const diff = new PNG({ width, height });

  // Create the diff image
  const diffCount = pixelmatch(
    imgA.data,
    imgB.data,
    diff.data,
    width,
    height,
    {
      threshold: 0.1,
      includeAA: true,
      alpha: 0.5,
      diffColor: [255, 0, 0], // Red for differences
      diffColorAlt: [0, 0, 255], // Blue for differences (alternating)
      diffMask: false
    }
  );

  // Save the diff image
  const outputPath = path.join(process.cwd(), 'public', outputFilename);
  await writeFile(outputPath, PNG.sync.write(diff));

  // Calculate statistics
  const totalPixels = width * height;
  const diffPercentage = (diffCount / totalPixels) * 100;

  return {
    path: `/${outputFilename}`,
    diffCount,
    totalPixels,
    diffPercentage
  };
}

export function generateDiffFilename(fileA: string, fileB: string): string {
  const timestamp = new Date().toISOString()
    .replace('T', '-')
    .replace(/:/g, '-')
    .split('.')[0];

  // Extract the URL part from the filenames (assuming format: prefix-timestamp-url.png)
  const urlA = fileA.split('-').slice(2, -1).join('-');
  const urlB = fileB.split('-').slice(2, -1).join('-');

  return `diff-${timestamp}-${urlA}-vs-${urlB}.png`;
}