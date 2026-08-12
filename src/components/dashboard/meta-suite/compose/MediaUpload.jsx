import { useState, useRef } from 'react';

export default function MediaUpload({
  accept = 'image/*',
  value = '',
  onChange,
  placeholder = 'https://...',
  label = 'Media',
  maxSizeMB = 100,
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so re-selecting the same file triggers onChange
    e.target.value = '';

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds ${maxSizeMB} MB limit.`);
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use XMLHttpRequest for upload progress
      const url = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/media/upload');

        xhr.upload.addEventListener('progress', (evt) => {
          if (evt.lengthComputable) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.url);
            } catch {
              reject(new Error('Invalid response from server.'));
            }
          } else {
            let detail = 'Upload failed.';
            try {
              const data = JSON.parse(xhr.responseText);
              detail = data.error || data.detail || detail;
            } catch {
              // keep default
            }
            reject(new Error(detail));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted.')));

        xhr.send(formData);
      });

      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const isImage = value && /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(value);

  return (
    <div>
      <label className="block text-xs text-text-muted mb-2">{label}</label>

      <div className="border border-border rounded-lg bg-bg-elevated p-3 space-y-3">
        {/* Upload button row */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider border border-primary/40 text-primary hover:bg-primary/10 disabled:border-border disabled:text-text-subtle disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {uploading ? 'Uploading...' : 'Upload file'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />

          {uploading && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-text-subtle whitespace-nowrap">
                {progress}%
              </span>
            </div>
          )}
        </div>

        {/* Preview thumbnail */}
        {value && isImage && (
          <div className="flex items-center gap-2">
            <img
              src={value}
              alt="Preview"
              className="w-10 h-10 rounded object-cover border border-border"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="text-[10px] text-text-subtle font-mono truncate flex-1">{value}</span>
          </div>
        )}

        {/* Paste URL fallback */}
        <div>
          <span className="block text-[10px] text-text-subtle font-mono mb-1">Or paste URL</span>
          <input
            type="url"
            value={value}
            onChange={(e) => { setError(''); onChange(e.target.value); }}
            placeholder={placeholder}
            className="w-full bg-bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-main placeholder-text-subtle focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-[10px] text-error font-mono">{error}</p>
        )}
      </div>
    </div>
  );
}
