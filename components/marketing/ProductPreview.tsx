export default function ProductPreview({ variant = "tracker" }: { variant?: "tracker" | "board" | "ai" }) {
  return <div className={"product-preview product-preview--" + variant}>
    <div className="preview-chrome"><span className="preview-monogram">it.</span><span>YOUR CAREER WORKSPACE</span><span className="ml-auto">Product preview</span></div>
    {variant === "ai" ? <div className="preview-body">
      <p className="eyebrow">Interview preparation</p><h3>A little preparation.<br />A more confident conversation.</h3>
      <div className="preview-question"><span>01 / PRACTISE</span><p>Tell me about a project where you solved a difficult problem.</p></div>
      <div className="preview-note"><strong>Make your experience specific</strong><p>Set the scene. Explain your contribution. Reflect on what you learned.</p></div>
      <p className="preview-caption">Illustrative guidance · Your results depend on your application.</p>
    </div> : variant === "board" ? <div className="preview-body">
      <p className="eyebrow">My applications</p><h3>Every next step, in view.</h3>
      <div className="preview-board">{[["Preparing", "Design internship", "Review portfolio"], ["Applied", "Graduate analyst", "Application sent"], ["Interview", "Software internship", "Prepare examples"]].map(([status, role, note]) => <div key={status}><span className="preview-column-label">{status}</span><div className="preview-ticket"><strong>{role}</strong><p>{note}</p><span className="preview-rule" /></div></div>)}</div>
      <p className="preview-caption">Illustrative applications · Track your own progress.</p>
    </div> : <div className="preview-body">
      <div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Your next move</p><h3>Ready for what’s next.</h3></div><span className="preview-avatar">JD</span></div>
      <div className="preview-role"><span className="preview-date">THU<strong>15</strong></span><div><span className="badge" data-status="Interview">Interview</span><h4>Software internship</h4><p>Prepare your project examples</p></div></div>
      <div className="preview-task"><span className="preview-check">✓</span><span>Save a role you’re interested in</span></div>
      <div className="preview-task"><span className="preview-check">✓</span><span>Keep your application up to date</span></div>
      <div className="preview-task"><span className="preview-check empty" /><span>Make time to prepare</span><span className="ml-auto">↗</span></div>
      <p className="preview-caption">Illustrative workspace · Not a live application.</p>
    </div>}
  </div>;
}
