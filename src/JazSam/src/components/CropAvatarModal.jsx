import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './CropAvatarModal.css';

function centerSquareCrop(w, h) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 72 }, 1, w, h),
    w, h,
  );
}

function buildCroppedDataUrl(imgEl, pixelCrop, outputSize = 256) {
  const canvas = document.createElement('canvas');
  canvas.width  = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');

  // Clip to circle so corners are transparent (not black)
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.clip();

  const scaleX = imgEl.naturalWidth  / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;

  ctx.drawImage(
    imgEl,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width  * scaleX,
    pixelCrop.height * scaleY,
    0, 0, outputSize, outputSize,
  );

  // PNG preserves transparency — no black corners
  return canvas.toDataURL('image/png');
}

export default function CropAvatarModal({ imageSrc, onSave, onCancel }) {
  const imgRef                          = useRef(null);
  const [crop,          setCrop]        = useState();
  const [completedCrop, setCompletedCrop] = useState();

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerSquareCrop(width, height));
  }

  function handleApply() {
    if (!completedCrop || !imgRef.current) return;
    onSave(buildCroppedDataUrl(imgRef.current, completedCrop));
  }

  return createPortal(
    <div className="cavm-backdrop" onClick={onCancel}>
      <div className="cavm-dialog" onClick={e => e.stopPropagation()}>

        <div className="cavm-header">
          <h3 className="cavm-title">Crop profile photo</h3>
          <button className="cavm-close" onClick={onCancel} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <p className="cavm-hint">Drag to reposition · Resize the circle with the handles</p>

        <div className="cavm-canvas">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
            circularCrop
            aspect={1}
            minWidth={60}
            keepSelection
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="cavm-img"
            />
          </ReactCrop>
        </div>

        <div className="cavm-actions">
          <button className="cavm-btn cavm-btn--cancel" onClick={onCancel}>Cancel</button>
          <button className="cavm-btn cavm-btn--apply" onClick={handleApply}>Apply photo</button>
        </div>

      </div>
    </div>,
    document.body,
  );
}
