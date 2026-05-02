interface LinkPreviewProps {
  url: string
  title: string
  description?: string
  domain?: string
  image?: string
}

export default function LinkPreview({ url, title, description, domain, image }: LinkPreviewProps) {
  const displayDomain = domain || new URL(url).hostname.replace('www.', '')

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="not-prose my-4 flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors duration-200 no-underline"
    >
      {image && (
        <div className="hidden sm:block shrink-0 w-36 relative">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-col justify-center gap-1 px-4 py-3 bg-white dark:bg-gray-900 flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
          {title}
        </p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug">
            {description}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{displayDomain}</p>
      </div>
    </a>
  )
}
