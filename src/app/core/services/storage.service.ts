import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly storage = inject(Storage);

  async uploadImage(file: File, path: string): Promise<string> {
    const compressed = await this.compress(file);
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
    return getDownloadURL(storageRef);
  }

  async deleteFile(path: string): Promise<void> {
    await deleteObject(ref(this.storage, path));
  }

  private compress(file: File, quality = 0.7, maxDim = 1280): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compression failed')), 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}
