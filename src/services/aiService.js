// AI Design Generation Service — powered by Puter.js
// Completely free, no API keys needed, runs directly in browser

/**
 * Calls the Puter.js image generation API and returns up to `count` image URLs.
 * @param {string} prompt - User's fashion design description
 * @param {number} count  - Number of images to request (default 2)
 * @returns {{ prompt: string, images: { id: string, url: string, label: string }[] }}
 */
export async function generateDesigns(prompt, count = 2) {
  if (!prompt?.trim()) throw new Error('Prompt is required')
  
  if (!window.puter) {
    throw new Error('Puter SDK is not loaded. Please ensure you are connected to the internet.')
  }

  const fashionContext = `Professional high-end fashion editorial photography of: ${prompt}. Clean background, premium quality, highly detailed garment.`

  const images = []
  
  // We run them sequentially to avoid overwhelming the browser/API
  for (let i = 0; i < count; i++) {
    const url = await callPuter(fashionContext, i)
    if (url) {
      images.push({
        id: `gen-${Date.now()}-${i}`,
        url,
        label: `Design ${i + 1}`,
      })
    }
  }

  if (images.length === 0) {
    throw new Error('No images were generated. Puter AI might be temporarily unavailable.')
  }

  return { prompt, images }
}

/**
 * Single Puter.js image generation request.
 * Returns an image blob URL string or null on failure.
 */
async function callPuter(prompt, seed = 0) {
  try {
    // Check if puter is available
    if (!window.puter || !window.puter.ai) {
      console.error('[aiService] Puter SDK is completely missing!')
      return null
    }

    // puter.ai.txt2img returns an HTMLImageElement
    const imgElement = await window.puter.ai.txt2img(prompt + ` (variation ${seed + 1})`)
    
    // The src attribute contains the base64 or blob URL representing the image
    return imgElement?.src
  } catch (e) {
    console.error(`[aiService] callPuter failed (seed ${seed}):`, e.message || e)
    return null
  }
}

// Example prompts shown in the UI before first generation
export const EXAMPLE_PROMPTS = {
  man: [
    "Modern slim-fit formal shirt with blue pinstripes",
    "Elegant kurta with embroidered neckline for men",
    "Classic white Oxford button-down shirt",
  ],
  woman: [
    "Elegant evening gown with floral embroidery in deep maroon",
    "Silk saree blouse with intricate zari border design",
    "Modern flared dress with pastel colour palette",
  ],
  boy: [
    "Casual cotton t-shirt with minimal geometric print",
    "Smart boys party kurta in royal blue",
  ],
  girl: [
    "Cute floral frock with puff sleeves in pink",
    "Girls party lehenga with mirror work embroidery",
  ],
  baby: [
    "Soft pastel onesie with cute animal print",
    "Baby kurta set in white cotton with tiny embroidery",
  ],
}
