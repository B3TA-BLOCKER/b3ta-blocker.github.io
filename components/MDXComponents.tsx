import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import LinkPreview from './LinkPreview'
import ImageLightbox from './ImageLightbox'

export const components: MDXComponents = {
  Image: ImageLightbox,
  TOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
  LinkPreview,
  img: ImageLightbox,
}
