import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { IconButton, AccessibleIconButton, LabeledField, SemanticChip, Sparkline } from './primitives.jsx';

describe('primitives rendering contracts', () => {
  it('IconButton maps label/title defaults and type default', () => {
    render(<IconButton label="Save">S</IconButton>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('title', 'Save');
  });

  it('AccessibleIconButton remains an alias of IconButton behavior', () => {
    render(<AccessibleIconButton label="Delete" title="Remove item">X</AccessibleIconButton>);
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('title', 'Remove item');
  });
});

describe('LabeledField prop behavior and a11y defaults', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('binds label htmlFor/id and sets aria-labelledby fallback for child control', () => {
    render(
      <LabeledField label="Project Name">
        <input />
      </LabeledField>,
    );

    const input = screen.getByRole('textbox');
    const label = screen.getByText('Project Name');

    expect(input.id).toMatch(/^labeled-field-\d+$/);
    expect(label).toHaveAttribute('for', input.id);
    expect(input).toHaveAttribute('aria-labelledby', `${input.id}-label`);
    expect(label).toHaveAttribute('id', `${input.id}-label`);
  });

  it('preserves explicit id and aria-labelledby supplied by the child', () => {
    render(
      <LabeledField label="Summary" id="summary-field">
        <textarea id="summary-control" aria-labelledby="custom-label-id" />
      </LabeledField>,
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'summary-control');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-labelledby', 'custom-label-id');
    expect(screen.getByText('Summary')).toHaveAttribute('for', 'summary-field');
  });
});

describe('SemanticChip case mapping', () => {
  const CASES = [
    {
      name: 'status value mapping applies published colors',
      props: { kind: 'status', value: 'published' },
      expected: { color: 'rgb(60, 230, 166)', background: 'rgba(60, 230, 166, 0.12)' },
    },
    {
      name: 'risk fallback mapping applies default colors for unknown keys',
      props: { kind: 'risk', value: 'unknown' },
      expected: { color: 'rgb(139, 149, 163)', background: 'rgba(139, 149, 163, 0.12)' },
    },
    {
      name: 'unknown kind falls back to category defaults',
      props: { kind: 'new-kind', value: 'x' },
      expected: { border: '1px solid var(--border)', background: 'var(--bg-3)' },
    },
  ];

  it.each(CASES)('$name', ({ props, expected }) => {
    const { container } = render(<SemanticChip {...props} />);
    const chip = container.querySelector('span');
    expect(chip).toHaveTextContent(props.value);

    if (expected.color) expect(chip).toHaveStyle({ color: expected.color });
    if (expected.background) expect(chip).toHaveStyle({ background: expected.background });
    if (expected.border) expect(chip).toHaveStyle({ border: expected.border });
  });

  it('uses children content over value and merges style overrides', () => {
    const { container } = render(
      <SemanticChip kind="status" value="draft" style={{ color: 'rgb(255, 255, 255)' }}>
        Custom
      </SemanticChip>,
    );
    const chip = container.querySelector('span');
    expect(chip).toHaveTextContent('Custom');
    expect(chip).toHaveStyle({ color: 'rgb(255, 255, 255)' });
  });
});

describe('Sparkline rendering contracts', () => {
  it('returns null for empty values', () => {
    const { container } = render(<Sparkline values={[]} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders polyline, baseline, and all markers according to props', () => {
    const { container } = render(
      <Sparkline values={[3, 5, 4]} baseline="mid" marker="all" strokeWidth="thick" colorRole="contrast" />,
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(container.querySelector('line')).not.toBeNull();
    expect(container.querySelector('polyline')).toHaveAttribute('stroke-width', '2.25');
    expect(container.querySelector('polyline')).toHaveAttribute('stroke', '#F4F5F7');
    expect(container.querySelectorAll('circle')).toHaveLength(3);
  });

  it('defaults to last marker and omits baseline', () => {
    const { container } = render(<Sparkline values={[2, 3, 5]} marker="last" baseline="none" colorRole="subtle" accentColor="#123456" />);

    expect(container.querySelector('line')).toBeNull();
    expect(container.querySelectorAll('circle')).toHaveLength(1);
    expect(container.querySelector('polyline')).toHaveAttribute('stroke', '#12345699');
  });
});
