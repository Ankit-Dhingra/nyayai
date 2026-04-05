export default function CaseCard({ case: c }) {
  return (
    <a
      href={c.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-navy-800 border border-navy-600 hover:border-gold-400 p-5 transition-all duration-300 group"
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="text-white font-medium group-hover:text-gold-400 transition-colors leading-snug">
            {c.title}
          </h3>
          <div className="flex gap-4 mt-2">
            {c.court && <span className="text-gray-500 text-sm">{c.court}</span>}
            {c.date && <span className="text-gray-600 text-sm">{c.date}</span>}
          </div>
        </div>
        <span className="text-gold-400 text-lg opacity-0 group-hover:opacity-100 transition-opacity">→</span>
      </div>
    </a>
  )
}