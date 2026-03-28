/**
 * Mock AI Verification Service
 * Simulates AI-powered document analysis for NIC images.
 */
export const aiVerificationService = {
  /**
   * Simulates verification of a document image.
   * @param {File} file - The image file to "analyze"
   * @returns {Promise<{
   *   status: 'valid' | 'invalid',
   *   confidence: number,
   *   details: string,
   *   extractedData?: { name?: string, id?: string }
   * }>}
   */
  async verifyDocument(file, nicNumber) {
    console.log('[AI Service] Analyzing document:', file.name, 'for NIC:', nicNumber)
    
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 2500))
    
    // 1. Basic File Checks
    if (file.size < 5000) {
      return {
        status: 'invalid',
        confidence: 0.15,
        details: 'Image resolution too low. Please upload a clear, high-resolution photo of your NIC.'
      }
    }

    if (!file.type.startsWith('image/')) {
      return {
        status: 'invalid',
        confidence: 0,
        details: 'Unsupported file format. Please upload a JPG or PNG image.'
      }
    }

    // 2. Sri Lankan NIC Validation
    // Old format: 9 digits + V/X, New format: 12 digits
    const oldNicRegex = /^[0-9]{9}[VvXx]$/;
    const newNicRegex = /^[0-9]{12}$/;

    if (!nicNumber) {
      return {
        status: 'invalid',
        confidence: 0,
        details: 'NIC number is required for verification.'
      }
    }

    const trimmed = nicNumber.trim();
    const isOldFormat = oldNicRegex.test(trimmed);
    const isNewFormat = newNicRegex.test(trimmed);
    const isValidFormat = isOldFormat || isNewFormat;

    if (!isValidFormat) {
      return {
        status: 'invalid',
        confidence: 0,
        details: 'Invalid NIC format. Use old format (9 digits + V/X, e.g. 199512345V) or new format (12 digits, e.g. 200012345678).'
      }
    }

    // Detect NIC type
    const nicType = isOldFormat ? 'Old Format NIC' : 'New Format NIC';

    // Success simulation
    return {
      status: 'valid',
      confidence: 0.98,
      details: `Sri Lankan ${nicType} detected and verified against identity database.`,
      extractedData: {
        id: trimmed,
        matchProbability: 'High',
        type: nicType
      }
    }
  }
}
