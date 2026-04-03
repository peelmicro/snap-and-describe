/**
 * Simple shared state for passing the captured photo
 * from the camera screen back to the home screen.
 *
 * Why not use route params? The camera returns a data: URI (base64)
 * which can be megabytes long — too large for URL parameters.
 * This module stores it in memory instead.
 */

interface CapturedPhoto {
  uri: string;
  mimeType: string;
}

let capturedPhoto: CapturedPhoto | null = null;

export function setCapturedPhoto(photo: CapturedPhoto | null) {
  capturedPhoto = photo;
}

export function getCapturedPhoto(): CapturedPhoto | null {
  const photo = capturedPhoto;
  capturedPhoto = null; // consume once
  return photo;
}
