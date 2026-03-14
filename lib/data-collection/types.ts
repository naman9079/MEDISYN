export type SourceType = "reddit" | "rss" | "web-page"

export type BaseSourceConfig = {
  id: string
  name: string
  enabled: boolean
  keywords?: string[]
}

export type RedditSourceConfig = BaseSourceConfig & {
  type: "reddit"
  subreddit: string
  query: string
  sort?: "new" | "relevance" | "top"
  limit?: number
}

export type RssSourceConfig = BaseSourceConfig & {
  type: "rss"
  feedUrl: string
  limit?: number
}

export type WebPageSourceConfig = BaseSourceConfig & {
  type: "web-page"
  url: string
  selectorHint?: string
  maxSnippets?: number
}

export type SourceConfig = RedditSourceConfig | RssSourceConfig | WebPageSourceConfig

export type RawDiscussion = {
  id: string
  sourceId: string
  sourceType: SourceType
  sourceName: string
  title: string
  text: string
  url: string
  author?: string
  createdAt?: string
  collectedAt: string
  keywords: string[]
  metadata?: Record<string, unknown>
}

export type SourceResult = {
  source: SourceConfig
  items: RawDiscussion[]
  error?: string
}

export type CollectionRun = {
  generatedAt: string
  totalItems: number
  sourceCount: number
  successfulSources: number
  failedSources: number
  sources: Array<{
    id: string
    name: string
    type: SourceType
    itemCount: number
    error?: string
  }>
  items: RawDiscussion[]
}
