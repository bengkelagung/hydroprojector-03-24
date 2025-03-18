
/**
 * Utility function to remove any visual elements added by the QR scanner library
 */
export const removeQRScannerOverlays = (): void => {
  // Hide any frame or scan region indicators
  const scanRegion = document.querySelector('#qr-shaded-region');
  if (scanRegion) {
    (scanRegion as HTMLElement).style.display = 'none';
  }
  
  // Remove any scan line animations
  const scanLine = document.querySelector('.scan-region-highlight');
  if (scanLine) {
    (scanLine as HTMLElement).style.display = 'none';
  }
  
  // Remove any overlay text
  const textElements = document.querySelectorAll('#qr-reader__dashboard_section_csr span');
  textElements.forEach(el => {
    (el as HTMLElement).style.display = 'none';
  });
  
  // Remove borders around the scanner
  const qrReader = document.getElementById('qr-reader');
  if (qrReader) {
    qrReader.style.border = 'none';
    qrReader.style.boxShadow = 'none';
    qrReader.style.background = '#000';
  }
  
  // Remove any helper text elements
  const helperText = document.getElementById('qr-reader__status_span');
  if (helperText) {
    helperText.style.display = 'none';
  }
  
  // Remove any other overlays or indicators
  const indicators = document.querySelectorAll('.qr-region-indicator');
  indicators.forEach(el => {
    (el as HTMLElement).style.display = 'none';
  });
};
