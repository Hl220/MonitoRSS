export enum MessageBrokerQueue {
  UrlFetchCompleted = "url.fetch.completed",
  UrlFetchBatch = "url.fetch-batch",
  UrlFailing = "url.failing",
  UrlFailedDisableFeeds = "url.failed.disable-feeds",
  UrlRejectedDisableFeeds = "url.rejected.disable-feeds",
  FeedRejectedArticleDisableConnection = "feed.rejected-article.disable-connection",
  FeedDeliverArticles = "feed.deliver-articles",
  FeedDeleted = "feed.deleted",
  FeedRejectedDisableFeed = "feed.rejected.disable-feed",
  SyncSupporterDiscordRoles = "sync-supporter-discord-roles",
}
