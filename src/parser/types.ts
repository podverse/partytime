// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { ItunesEpisodeType } from "./item";
import type {
  Phase1Transcript,
  Phase1Funding,
  Phase1Chapter,
  Phase1SoundBite,
} from "./phase/phase-1";
import type {
  Phase2Person,
  Phase2Location,
  Phase2SeasonNumber,
  Phase2EpisodeNumber,
} from "./phase/phase-2";
import type { Phase3Trailer, Phase3License, Phase3AltEnclosure } from "./phase/phase-3";
import type {
  Phase4Value,
  Phase4Medium,
  Phase4PodcastImage,
  Phase4PodcastLiveItem,
} from "./phase/phase-4";
import {
  PhasePendingPodcastId,
  PhasePendingSocial,
  PhasePendingSocialInteract,
  PhasePendingPodcastRecommendation,
  PhasePendingGateway,
} from "./phase/phase-pending";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TODO = any;
export type XmlNode = TODO;

/** Represents basic object type with typed values */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Obj<ValueT = any> = Record<string, ValueT>;
/** An empty object with no keys. Using {} means any non-nullish value, not an object with no keys */
export type EmptyObj = Obj<never>;

export interface RSSFeed {
  rss: {
    channel: TODO;
  };
}

export enum FeedType {
  RSS = 0,
  ATOM = 1,
  BadFormat = 9,
}

export enum ItunesFeedType {
  /**
   * Default Specify episodic when episodes are intended to be consumed without any specific order. Apple
   * Podcasts will present newest episodes first and display the publish date (required) of each episode. If
   * organized into seasons, the newest season will be presented first - otherwise, episodes will be grouped
   * by year published, newest first.
   */
  Episodic = "episodic",
  /** Specify serial when episodes are intended to be consumed in sequential order. Apple Podcasts will
   * present the oldest episodes first and display the episode numbers (required) of each episode. If
   * organized into seasons, the newest season will be presented first and <itunes:episode> numbers must be
   * given for each episode.
   *
   * For new subscribers, Apple Podcasts adds the first episode to their Library, or the entire current season
   * if using seasons.
   */
  Serial = "serial",
}

export interface FeedObject {
  type: FeedType;
  // #region RSS 2.0 Spec Required
  // https://validator.w3.org/feed/docs/rss2.html
  title: string;
  link: string;
  description: string;
  // #endregion
  // #region iTunes Required
  // https://help.apple.com/itc/podcasts_connect/#/itcb54353390
  language?: string;
  explicit: boolean;
  itunesImage?: string;
  itunesCategory?: string[];
  // #endregion

  /** \<itunes:block\> Prevent the podcast from showing up in Apple Podcasts */
  itunesBlock: boolean;
  /** \<itunes:complete\> indicates that a podcast is complete and you will not post any more episodes in the future. */
  itunesComplete: boolean;
  /** Copyright notice for content in the channel */
  copyright?: string;
  /** Email address for person responsible for technical issues relating to channel */
  webmaster?: string;
  /** Email address for person responsible for editorial content */
  managingEditor?: string;
  /** number of minutes that indicates how long a channel can be cached before refreshing from the source */
  ttl?: number;
  subtitle?: string;
  summary?: string;

  generator?: string;
  /** Seconds from epoch */
  pubDate?: Date;
  /** The last time the content of the channel changed. */
  lastBuildDate?: Date;

  itunesType?: ItunesFeedType;
  /**
   * The new podcast RSS Feed URL. If you change the URL of your podcast feed, you should use this tag in your
   * new feed.
   */
  itunesNewFeedUrl?: string;
  /** Parsed and handled */
  categories?: string[];

  pubsub?: { hub?: string; self?: string; next?: string };
  author?: string;
  owner?: {
    email: string;
    name: string;
  };
  image?: {
    url: string;
    title?: string;
    link?: string;
    width?: number;
    height?: number;
  };

  // #region Phase 1
  podcastOwner?: string;
  /**
   * The purpose is to tell other podcast platforms whether they are allowed to import this feed. If this is
   * true, any attempt to import this feed into a new platform should be rejected.
   */
  locked?: boolean;
  /**
   * This tag lists possible donation/funding links for the podcast. The content of the tag is the recommended
   * string to be used with the link.
   */
  podcastFunding?: Phase1Funding[];
  // #endregion
  // #region Phase 2
  /**
   * This element specifies a person of interest to the podcast. It is primarily intended to identify people
   * like hosts, co-hosts and guests.
   */
  podcastPeople?: Phase2Person[];
  /** What is this podcast about */
  podcastLocation?: Phase2Location;
  // #endregion
  // #region Phase 3
  trailers?: Phase3Trailer[];
  license?: Phase3License;
  guid?: string;
  // #endregion
  // #region Phase 4
  value?: Phase4Value;
  // #endregion
  // #region Pending Phase
  podcastLiveItems?: Phase4PodcastLiveItem[];
  /** PENDING AND LIKELY TO CHANGE indicates a listing on multiple platforms, directories, hosts, apps and services. */
  podcastId?: PhasePendingPodcastId[];
  /** PENDING AND LIKELY TO CHANGE where listeners can comment, share, or like podcast episodes */
  podcastSocial?: PhasePendingSocial[];
  /** PENDING AND LIKELY TO CHANGE This tag tells the an application what the content contained within the feed IS, as opposed to what the content is ABOUT in the case of a category. */
  medium?: Phase4Medium;
  podcastImages?: Phase4PodcastImage[];
  podcastRecommendations?: PhasePendingPodcastRecommendation[];
  // #endregion

  /** podcasting 2.0 phase compliance */
  pc20support: Record<number, string[]>;

  items: Episode[];
  newestItemPubDate?: Date;
  oldestItemPubDate?: Date;
  /** Date this feed was parsed */
  lastUpdate: Date;
}

export type Enclosure = {
  url: string;
  length: number;
  type: string;
};

export interface Episode {
  author?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  duration: number;
  enclosure: Enclosure;
  itunesEpisode?: number;
  itunesEpisodeType?: ItunesEpisodeType;
  explicit: boolean;
  itunesImage?: string;
  summary?: string;
  itunesSeason?: number;
  keywords?: string[];
  pubDate?: Date;
  guid: string;
  description?: string;
  image?: string;
  // #region Phase 1
  /**
   * This tag is used to link to a transcript or closed captions file. Multiple tags can be present for
   * multiple transcript formats.
   * */
  podcastChapters?: Phase1Chapter;
  podcastSoundbites?: Phase1SoundBite[];
  podcastTranscripts?: Phase1Transcript[];
  // #endregion
  // #region Phase 2
  podcastLocation?: Phase2Location;
  podcastPeople?: Phase2Person[];
  podcastSeason?: Phase2SeasonNumber;
  podcastEpisode?: Phase2EpisodeNumber;
  // #endregion
  // #region Phase 3
  license?: Phase3License;
  alternativeEnclosures?: Phase3AltEnclosure[];
  // #endregion
  // #region Phase 4
  value?: Phase4Value;
  // #endregion
  // #region Pending Phase
  podcastSocialInteraction?: PhasePendingSocialInteract[];
  podcastImages?: Phase4PodcastImage[];
  podcastRecommendations?: PhasePendingPodcastRecommendation[];
  podcastGateway?: PhasePendingGateway;
  // #endregion
}

export interface PhaseUpdate {
  [p: number]: { [k: string]: boolean };
}
