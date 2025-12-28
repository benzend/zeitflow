import { db } from '../lib/db';
import { assetsTable } from '../schema';
import { eq, or, isNull } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import path from 'path';
import imageSize from 'image-size';
import sharp from 'sharp';

/**
 * Script to backfill existing assets with image dimensions and blur data
 * Run this once to migrate existing assets to the new schema
 */

async function processExistingAssets() {
  console.log('🚀 Starting asset backfill process...');
  
  try {
    // Get all image assets that don't have dimensions
    const assetsWithoutDimensions = await db
      .select({
        id: assetsTable.id,
        filename: assetsTable.filename,
        mimeType: assetsTable.mimeType,
        url: assetsTable.url,
        width: assetsTable.width,
        height: assetsTable.height,
        blurDataURL: assetsTable.blurDataURL,
      })
      .from(assetsTable)
      .where(
        // Get image assets where width or height is null
        or(
          isNull(assetsTable.width),
          isNull(assetsTable.height)
        )
      );

    console.log(`📊 Found ${assetsWithoutDimensions.length} assets to process`);

    if (assetsWithoutDimensions.length === 0) {
      console.log('✅ All assets already have dimensions. Nothing to process.');
      return;
    }

    let processedCount = 0;
    let errorCount = 0;

    for (const asset of assetsWithoutDimensions) {
      try {
        // Extract local file path from URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.HOST || 'http://localhost:3000';
        const relativeUrl = asset.url.replace(baseUrl + '/uploads/', '');
        const filePath = path.join(process.cwd(), 'public', 'uploads', relativeUrl);

        // Read the file
        const fileBuffer = await readFile(filePath);
        
        // Get image dimensions
        const dimensions = imageSize(fileBuffer);
        
        // Generate blur placeholder
        const blurBuffer = await sharp(fileBuffer)
          .resize(20, 20, { fit: 'inside', withoutEnlargement: true })
          .blur(10)
          .png({ quality: 80, compressionLevel: 9 })
          .toBuffer();
        
        const blurDataURL = `data:image/png;base64,${blurBuffer.toString('base64')}`;

        // Update the asset in database
        await db
          .update(assetsTable)
          .set({
            width: dimensions.width,
            height: dimensions.height,
            blurDataURL,
            updatedAt: new Date(),
          })
          .where(eq(assetsTable.id, asset.id));

        console.log(`✅ Processed asset ${asset.id}: ${asset.filename} (${dimensions.width}x${dimensions.height})`);
        processedCount++;

      } catch (error) {
        console.error(`❌ Error processing asset ${asset.id} (${asset.filename}):`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Backfill complete!`);
    console.log(`✅ Successfully processed: ${processedCount} assets`);
    console.log(`❌ Errors: ${errorCount} assets`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some assets failed to process. Check the errors above.');
    }

  } catch (error) {
    console.error('💥 Fatal error during backfill:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  processExistingAssets()
    .then(() => {
      console.log('🏁 Asset backfill script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Unhandled error:', error);
      process.exit(1);
    });
}

export { processExistingAssets };