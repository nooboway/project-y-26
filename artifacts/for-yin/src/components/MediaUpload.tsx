import { useState, useRef, useCallback } from 'react';

export type UploadResult = {
  url: string;
  publicId: string;
  resourceType: string;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes?: number;
};

type Props = {
  /** MIME type filter e.g. "image/*" or "audio/*,video/*" */
  accept?: string;
  /** Label shown in the drop zone */
  label?: string;
  /** Called when upload completes successfully */
  onUploaded: (result: UploadResult) => void;
  /** Admin token from auth context */
  token: string;
  /** Existing URL to preview before any upload */
  currentUrl?: string;
  /** Max file size in bytes. Default: 100MB */
  maxBytes?: number;
};

const DEFAULT_MAX = 100 * 1024 * 1024;

export function MediaUpload({
  accept = 'image/*',
  label = 'Upload file',
  onUploaded,
  token,
  currentUrl,
  maxBytes = DEFAULT_MAX,
}: Props) {
  type State = 'idle' | 'uploading' | 'done' | 'error';
  const [state, setState] = useState<State>('idle');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentUrl ?? '');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > maxBytes) {
        setState('error');
        setErrorMsg(
          `File too large. Max ${Math.round(maxBytes / 1024 / 1024)}MB.`
        );
        return;
      }
      setState('uploading');
      setProgress(0);
      setErrorMsg('');

      const formData = new FormData();
      formData.append('file', file);

      try {
        const result = await new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(JSON.parse(xhr.responseText) as UploadResult);
            } else {
              try {
                reject(new Error(JSON.parse(xhr.responseText).error));
              } catch {
                reject(new Error(`Upload failed (${xhr.status})`));
              }
            }
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.open('POST', '/api/admin/upload');
          xhr.setRequestHeader('x-admin-token', token);
          xhr.send(formData);
        });

        setPreview(result.url);
        setState('done');
        onUploaded(result);
      } catch (err: any) {
        setState('error');
        setErrorMsg(err?.message ?? 'Upload failed');
      }
    },
    [token, onUploaded, maxBytes]
  );

  const isImage = accept.includes('image');
  const mono: React.CSSProperties = {
    fontFamily: 'Space Mono, monospace',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Existing preview */}
      {preview && isImage && (
        <img
          src={preview}
          alt=""
          style={{
            width: '100%',
            maxHeight: '180px',
            objectFit: 'cover',
            borderRadius: '4px',
            border: '1px solid rgba(196,122,106,0.2)',
            marginBottom: '8px',
            display: 'block',
          }}
        />
      )}
      {preview && !isImage && (
        <div
          style={{
            ...mono,
            padding: '10px 14px',
            background: 'rgba(196,122,106,0.06)',
            border: '1px solid rgba(196,122,106,0.2)',
            borderRadius: '4px',
            color: 'var(--rose)',
            marginBottom: '8px',
            wordBreak: 'break-all',
          }}
        >
          ✓ {preview}
        </div>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e: any) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e: any) => e.preventDefault()}
        onDrop={(e: any) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        style={{
          border: `1.5px dashed ${
            state === 'uploading'
              ? 'var(--rose)'
              : state === 'error'
              ? '#c44'
              : 'rgba(196,122,106,0.3)'
          }`,
          borderRadius: '4px',
          padding: '20px 16px',
          textAlign: 'center',
          cursor: state === 'uploading' ? 'wait' : 'pointer',
          background:
            state === 'uploading' ? 'rgba(196,122,106,0.04)' : 'transparent',
          transition: 'all 0.2s',
          userSelect: 'none',
        }}
      >
        {state === 'uploading' ? (
          <div>
            <div style={{ ...mono, color: 'var(--rose)', marginBottom: '8px' }}>
              uploading… {progress}%
            </div>
            <div
              style={{
                height: '2px',
                background: 'rgba(196,122,106,0.15)',
                borderRadius: '1px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'var(--rose)',
                  transition: 'width 0.15s',
                }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              ...mono,
              color:
                state === 'done'
                  ? 'var(--rose)'
                  : 'rgba(158,107,114,0.6)',
            }}
          >
            {state === 'done'
              ? '✓ uploaded — tap to replace'
              : `${label} — tap or drag & drop`}
          </div>
        )}
      </div>

      {/* Error message */}
      {state === 'error' && (
        <div
          style={{
            ...mono,
            marginTop: '6px',
            color: '#c44',
            fontSize: '9px',
          }}
        >
          {errorMsg}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so same file can be re-uploaded after error
          e.target.value = '';
        }}
      />
    </div>
  );
}
