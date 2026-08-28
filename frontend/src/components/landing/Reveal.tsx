import type { CSSProperties, ReactNode } from 'react';
import { useReveal } from '../../lib/useReveal';

type Direction = 'up' | 'down' | 'left' | 'right' | 'scale';

const HIDDEN: Record<Direction, string> = {
  up: 'translate3d(0, 40px, 0)',
  down: 'translate3d(0, -40px, 0)',
  left: 'translate3d(-48px, 0, 0)',
  right: 'translate3d(48px, 0, 0)',
  scale: 'scale(0.92)',
};

/** Fades + slides its children in the first time they enter the viewport. */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 700,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span' | 'p';
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  const style: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? 'none' : HIDDEN[direction],
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}ms`,
    transitionDelay: `${delay}ms`,
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    willChange: shown ? undefined : 'opacity, transform',
  };

  return (
    <Tag ref={ref as never} className={`motion-reduce:!transform-none ${className}`} style={style}>
      {children}
    </Tag>
  );
}

/** Splits a line of text into words that rise into place one after another. */
export function TextReveal({
  text,
  delay = 0,
  stagger = 70,
  className = '',
  wordClassName = '',
}: {
  text: string;
  delay?: number;
  stagger?: number;
  className?: string;
  wordClassName?: string;
}) {
  const { ref, shown } = useReveal<HTMLSpanElement>(0.1);
  const words = text.split(' ');

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <span
            className={`inline-block ${wordClassName}`}
            style={{
              transform: shown ? 'none' : 'translateY(105%) rotate(4deg)',
              opacity: shown ? 1 : 0,
              transition: 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms ease',
              transitionDelay: `${delay + i * stagger}ms`,
            }}
          >
            {word}
          </span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}
