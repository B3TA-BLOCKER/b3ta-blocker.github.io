import ViewCount from '@/components/ViewCount'

interface PostMetaProps {
  slug: string
  minutes?: number
}

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 shrink-0"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

// "12 min read · 1.2K views" row shown above "Read more" in post lists.
export default function PostMeta({ slug, minutes }: PostMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium text-gray-500 dark:text-gray-400">
      {typeof minutes === 'number' && (
        <span className="inline-flex items-center gap-1.5">
          <ClockIcon />
          <span>{Math.max(1, Math.ceil(minutes))} min read</span>
        </span>
      )}
      <ViewCount slug={slug} />
    </div>
  )
}
