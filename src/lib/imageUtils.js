/**
 * Converts and compresses any uploaded image file to WebP format using HTML5 Canvas.
 * 
 * @param {File} file - The file uploaded from file input
 * @param {number} maxWidth - Maximum width (e.g. 1600 for cover, 400 for avatar)
 * @param {number} quality - Quality between 0.1 and 1.0 (default: 0.85)
 * @returns {Promise<string>} Base64 Data URL in image/webp format
 */
export const compressToWebP = (file, maxWidth = 1600, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    const reader = new FileReader();
    reader.onerror = (error) => reject(error);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = (error) => reject(error);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(event.target.result);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Check if browser supports image/webp export
        try {
          const webpDataUrl = canvas.toDataURL('image/webp', quality);
          if (webpDataUrl.startsWith('data:image/webp')) {
            resolve(webpDataUrl);
          } else {
            // Fallback to JPEG if WebP export is not supported
            const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(jpegDataUrl);
          }
        } catch (err) {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};
