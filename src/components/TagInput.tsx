import { useMemo, useState } from 'react';

interface TagInputProps {
  suggestions: string[];
  onAdd: (tag: string) => void;
}

export function TagInput({ suggestions, onAdd }: TagInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return [];
    return suggestions.filter((s) => s.toLowerCase().includes(trimmed) && s.toLowerCase() !== trimmed).slice(0, 6);
  }, [value, suggestions]);

  function submit(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  }

  return (
    <div className="tag-input-wrapper">
      <div className="tag-input-row">
        <input
          type="text"
          placeholder="Add a tag…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit(value);
            }
          }}
        />
        <button type="button" onClick={() => submit(value)}>
          Add
        </button>
      </div>
      {focused && matches.length > 0 && (
        <ul className="tag-suggestions">
          {matches.map((s) => (
            <li key={s}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => submit(s)}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
