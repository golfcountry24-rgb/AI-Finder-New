import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import styles from './Select.module.css';

/**
 * Custom select (ARIA "select-only combobox" pattern: button + listbox).
 * Replaces the native <select> so the open list is styled and animated.
 *
 * Keyboard: ↓ ↑ Home End to move, Enter/Space to choose, Esc to close,
 * Tab closes, typing a letter jumps to the next matching option.
 */
export function Select({ label, options, value, onChange }) {
  const uid = useId();
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState('bottom');

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );
  const selected = options[selectedIndex];
  const optionId = (i) => `${uid}-option-${i}`;

  const openList = useCallback(
    (index = selectedIndex) => {
      setActive(index);
      setOpen(true);
    },
    [selectedIndex],
  );

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const choose = (index) => {
    const option = options[index];
    if (option && option.id !== value) onChange(option.id);
    close();
  };

  // when opening: decide up/down placement and move focus into the list
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const list = listRef.current;
    if (trigger && list) {
      const rect = trigger.getBoundingClientRect();
      const needed = list.scrollHeight + 16;
      const below = window.innerHeight - rect.bottom;
      setPlacement(below < needed && rect.top > below ? 'top' : 'bottom');
    }
    list?.focus({ preventScroll: true });
  }, [open]);

  // keep the active option in view
  useEffect(() => {
    if (!open) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  }, [active, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // click outside closes — and, like a native select, that click does nothing else
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      close(false);
      const swallow = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      document.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => document.removeEventListener('click', swallow, { capture: true }), 500);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, close]);

  const onTriggerKey = (event) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      openList(event.key === 'ArrowUp' ? Math.max(0, selectedIndex - 1) : selectedIndex);
    }
  };

  const onListKey = (event) => {
    const last = options.length - 1;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActive(0);
        break;
      case 'End':
        event.preventDefault();
        setActive(last);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(active);
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation(); // don't close a surrounding dialog
        close();
        break;
      case 'Tab':
        close(false);
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const char = event.key.toLowerCase();
          const order = [...options.slice(active + 1), ...options.slice(0, active + 1)];
          const match = order.find((o) => o.label.toLowerCase().startsWith(char));
          if (match) setActive(options.indexOf(match));
        }
    }
  };

  return (
    <div ref={rootRef} className={styles.select} data-open={open || undefined}>
      <span id={`${uid}-label`} className={styles.label}>
        {label}
      </span>
      <button
        ref={triggerRef}
        id={`${uid}-trigger`}
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-labelledby={`${uid}-label ${uid}-trigger`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKey}
      >
        <span className={styles.value}>{selected?.label}</span>
        <svg className={styles.chevron} viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5 6 6.5l5-5" />
        </svg>
      </button>

      <ul
        ref={listRef}
        id={`${uid}-list`}
        role="listbox"
        tabIndex={-1}
        aria-labelledby={`${uid}-label`}
        aria-activedescendant={open ? optionId(active) : undefined}
        className={`${styles.menu} ${placement === 'top' ? styles.top : ''}`}
        onKeyDown={onListKey}
      >
        {options.map((option, i) => {
          const isSelected = i === selectedIndex;
          return (
            <li
              key={option.id}
              id={optionId(i)}
              role="option"
              aria-selected={isSelected}
              className={`${styles.option} ${i === active ? styles.active : ''}`}
              style={{ '--i': i }}
              onPointerMove={() => setActive(i)}
              onClick={() => choose(i)}
            >
              <span>{option.label}</span>
              <svg className={styles.check} viewBox="0 0 16 16" aria-hidden="true">
                <path d="m3.5 8.5 3 3 6-7" />
              </svg>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
