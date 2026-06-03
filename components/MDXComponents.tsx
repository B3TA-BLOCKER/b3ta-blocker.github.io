import TOCInline from 'pliny/ui/TOCInline'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import LinkPreview from './LinkPreview'
import ImageLightbox from './ImageLightbox'
import Pre from './Pre'

const MdxImage = (props: any) => (
  <ImageLightbox
    {...props}
    src={props.src || ''}
    alt={props.alt || ''}
    width={props.width || 800}
    height={props.height || 500}
  />
)

export const components: MDXComponents = {
  Image: MdxImage,
  img: MdxImage,
  TOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
  LinkPreview,
}
