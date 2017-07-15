export module ClientConfig {
  export interface SearchConfig {
    enabled: boolean
    instantSearchEnabled: boolean
    autocompleteEnabled: boolean
  }

  export interface SharingConfig {
    enabled: boolean;
    passwordProtected: boolean;
  }

  export interface MapConfig {
    enabled: boolean;
    googleApiKey: string;
  }
  export interface ThumbnailConfig {
    iconSize: number;
    thumbnailSizes: Array<number>;
  }

  export interface Config {
    applicationTitle: string;
    Thumbnail: ThumbnailConfig;
    Search: SearchConfig;
    Sharing: SharingConfig;
    Map: MapConfig;
    concurrentThumbnailGenerations: number;
    enableCache: boolean;
    enableOnScrollRendering: boolean;
    enableOnScrollThumbnailPrioritising: boolean;
    authenticationRequired: boolean;
    publicUrl: string;
  }

}
/**
 * These configuration will be available at frontend and backend too
 */
export class PublicConfigClass {

  public Client: ClientConfig.Config = {
    applicationTitle: "PiGallery 2",
    Thumbnail: {
      thumbnailSizes: [200, 400, 600],
      iconSize: 30
    },
    Search: {
      enabled: true,
      instantSearchEnabled: true,
      autocompleteEnabled: true
    },
    Sharing: {
      enabled: true,
      passwordProtected: true
    },
    Map: {
      enabled: true,
      googleApiKey: ""
    },
    concurrentThumbnailGenerations: 1,
    enableCache: false,
    enableOnScrollRendering: true,
    enableOnScrollThumbnailPrioritising: true,
    authenticationRequired: true,
    publicUrl: ""
  };

}
