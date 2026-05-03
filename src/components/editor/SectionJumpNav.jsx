export default function SectionJumpNav({ sections = [], activeId, onJump }) {
  return (
    <div className="section-jump-nav" role="navigation" aria-label="Jump to section">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`btn btn-ghost btn-sm ${activeId === section.id ? 'active' : ''}`}
          onClick={() => onJump(section.id)}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}
