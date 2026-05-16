import { useEffect, useRef, useState } from 'react';
import { Button } from './UI.jsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoPicker({
  value,
  onChange,
  label = 'Video',
  accept = 'video/*,video/quicktime,.mov,.qt,.mp4,.webm,.mkv,.ogv',
}) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function pick(file) {
    if (!file) return;
    onChange(file);
  }

  function clear() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <div className="text-sm text-muted mb-1.5">{label}</div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {previewUrl ? (
        <div className="rounded-xl2 border border-line bg-sunken overflow-hidden">
          <video
            src={previewUrl}
            controls
            muted
            playsInline
            className="w-full aspect-video bg-black object-contain"
          />
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm truncate">{value.name}</div>
              <div className="text-xs text-muted">
                {formatSize(value.size)} · {value.type || 'video'}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              <Button type="button" variant="ghost" onClick={clear}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl2 border border-dashed border-line bg-surface hover:bg-sunken transition-colors py-12 text-center"
        >
          <div className="font-medium">Upload a video</div>
          <p className="text-sm text-muted mt-1">MP4, WebM, or MOV. Up to 200 MB.</p>
        </button>
      )}
    </div>
  );
}
