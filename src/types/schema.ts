/* An RFC 3986, RFC 3987, and RFC 6570 (level 4) compliant URI string. */
export type URI = any

/* A string containing HTML code. */
export type HTML = any

/* An ISO-8601 encoded UTC date string. */
export type DateTime = any

/* A Git object ID. */
export type GitObjectID = any

/* An ISO-8601 encoded date string. Unlike the DateTime type, GitTimestamp is not converted in UTC. */
export type GitTimestamp = any

/* Git SSH string */
export type GitSSHRemote = any

/* A valid x509 certificate string */
export type X509Certificate = any

/* An ISO-8601 encoded date string. */
export type Date = any

/* An object with an ID. */
export interface Node {
  id: string /* ID of the object. */
}

/* Represents an object which can take actions on GitHub. Typically a User or Bot. */
export interface Actor {
  avatarUrl: URI /* A URL pointing to the actor&#x27;s public avatar. */
  login: string /* The username of the actor. */
  resourcePath: URI /* The HTTP path for this actor. */
  url: URI /* The HTTP URL for this actor. */
}

/* Represents an owner of a Project. */
export interface ProjectOwner {
  id: string
  project?: Project | null /* Find project by number. */
  projects: ProjectConnection /* A list of projects under the owner. */
  projectsResourcePath: URI /* The HTTP path listing owners projects */
  projectsUrl: URI /* The HTTP URL listing owners projects */
  viewerCanCreateProjects: boolean /* Can the current viewer create new projects on this owner. */
}

/* An object that can be closed */
export interface Closable {
  closed: boolean /* &#x60;true&#x60; if the object is closed (definition of closed may depend on type) */
  closedAt?: DateTime | null /* Identifies the date and time when the object was closed. */
}

/* Entities that can be updated. */
export interface Updatable {
  viewerCanUpdate: boolean /* Check if the current viewer can update this object. */
}

/* An object that can have users assigned to it. */
export interface Assignable {
  assignees: UserConnection /* A list of Users assigned to this object. */
}

/* Represents an owner of a Repository. */
export interface RepositoryOwner {
  avatarUrl: URI /* A URL pointing to the owner&#x27;s public avatar. */
  id: string
  login: string /* The username used to login. */
  pinnedRepositories: RepositoryConnection /* A list of repositories this user has pinned to their profile */
  repositories: RepositoryConnection /* A list of repositories that the user owns. */
  repository?: Repository | null /* Find Repository. */
  resourcePath: URI /* The HTTP URL for the owner. */
  url: URI /* The HTTP URL for the owner. */
}

/* Entities that can be subscribed to for web and email notifications. */
export interface Subscribable {
  id: string
  viewerCanSubscribe: boolean /* Check if the viewer is able to change their subscription status for the repository. */
  viewerSubscription: SubscriptionState /* Identifies if the viewer is watching, not watching, or ignoring the subscribable entity. */
}

/* Things that can be starred. */
export interface Starrable {
  id: string
  stargazers: StargazerConnection /* A list of users who have starred this starrable. */
  viewerHasStarred: boolean /* Returns a boolean indicating whether the viewing user has starred this starrable. */
}

/* Represents a type that can be retrieved by a URL. */
export interface UniformResourceLocatable {
  resourcePath: URI /* The HTML path to this resource. */
  url: URI /* The URL to this resource. */
}

/* A subset of repository info. */
export interface RepositoryInfo {
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  description?: string | null /* The description of the repository. */
  descriptionHTML: HTML /* The description of the repository rendered to HTML. */
  forkCount: number /* Returns how many forks there are of this repository in the whole network. */
  hasIssuesEnabled: boolean /* Indicates if the repository has issues feature enabled. */
  hasWikiEnabled: boolean /* Indicates if the repository has wiki feature enabled. */
  homepageUrl?: URI | null /* The repository&#x27;s URL. */
  isArchived: boolean /* Indicates if the repository is unmaintained. */
  isFork: boolean /* Identifies if the repository is a fork. */
  isLocked: boolean /* Indicates if the repository has been locked or not. */
  isMirror: boolean /* Identifies if the repository is a mirror. */
  isPrivate: boolean /* Identifies if the repository is private. */
  license?: string | null /* The license associated with the repository */
  licenseInfo?: License | null /* The license associated with the repository */
  lockReason?: RepositoryLockReason | null /* The reason the repository has been locked. */
  mirrorUrl?: URI | null /* The repository&#x27;s original mirror URL. */
  name: string /* The name of the repository. */
  nameWithOwner: string /* The repository&#x27;s name with owner. */
  owner: RepositoryOwner /* The User owner of the repository. */
  pushedAt?: DateTime | null /* Identifies when the repository was last pushed to. */
  resourcePath: URI /* The HTTP path for this repository */
  shortDescriptionHTML: HTML /* A description of the repository, rendered to HTML without any links in it. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this repository */
}

/* Represents a comment. */
export interface Comment {
  author?: Actor | null /* The actor who authored the comment. */
  authorAssociation: CommentAuthorAssociation /* Author&#x27;s association with the subject of the comment. */
  body: string /* The comment body as Markdown. */
  bodyHTML: HTML /* The comment body rendered to HTML. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  createdViaEmail: boolean /* Check if this comment was created via an email reply. */
  editor?: Actor | null /* The actor who edited the comment. */
  id: string
  lastEditedAt?: DateTime | null /* The moment the editor made the last edit */
  publishedAt?: DateTime | null /* Identifies when the comment was published at. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  viewerDidAuthor: boolean /* Did the viewer author this comment. */
}

/* Entities that can be deleted. */
export interface Deletable {
  viewerCanDelete: boolean /* Check if the current viewer can delete this object. */
}

/* Comments that can be updated. */
export interface UpdatableComment {
  viewerCannotUpdateReasons: CommentCannotUpdateReason[] /* Reasons why the current viewer can not update this comment. */
}

/* Represents a subject that can be reacted on. */
export interface Reactable {
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
  reactionGroups: ReactionGroup[] /* A list of reactions grouped by content left on the subject. */
  reactions: ReactionConnection /* A list of Reactions left on the Issue. */
  viewerCanReact: boolean /* Can user react to this subject */
}

/* Represents a object that belongs to a repository. */
export interface RepositoryNode {
  repository: Repository /* The repository associated with this node. */
}

/* Represents a Git object. */
export interface GitObject {
  abbreviatedOid: string /* An abbreviated version of the Git object ID */
  commitResourcePath: URI /* The HTTP path for this Git object */
  commitUrl: URI /* The HTTP URL for this Git object */
  id: string
  oid: GitObjectID /* The Git object ID */
  repository: Repository /* The Repository the Git object belongs to */
}

/* Information about a signature (GPG or S/MIME) on a Commit or Tag. */
export interface GitSignature {
  email: string /* Email used to sign this object. */
  isValid: boolean /* True if the signature is valid and verified by GitHub. */
  payload: string /* Payload for GPG signing object. Raw ODB object without the signature header. */
  signature: string /* ASCII-armored signature header from object. */
  signer?: User | null /* GitHub user corresponding to the email signing this commit. */
  state: GitSignatureState /* The state of this signature. &#x60;VALID&#x60; if signature is valid and verified by GitHub, otherwise represents reason why signature is considered invalid. */
}

/* An object that can have labels assigned to it. */
export interface Labelable {
  labels?: LabelConnection | null /* A list of labels associated with the object. */
}

/* An object that can be locked. */
export interface Lockable {
  locked: boolean /* &#x60;true&#x60; if the object is locked */
}

/* The query root of GitHub&#x27;s GraphQL interface. */
export interface Query {
  codeOfConduct?: CodeOfConduct | null /* Look up a code of conduct by its key */
  codesOfConduct?:
    | CodeOfConduct[]
    | null /* Look up a code of conduct by its key */
  license?: License | null /* Look up an open source license by its key */
  licenses: License[] /* Return a list of known open source licenses */
  marketplaceCategories: MarketplaceCategory[] /* Get alphabetically sorted list of Marketplace categories */
  marketplaceCategory?: MarketplaceCategory | null /* Look up a Marketplace category by its slug. */
  marketplaceListing?: MarketplaceListing | null /* Look up a single Marketplace listing */
  marketplaceListings: MarketplaceListingConnection /* Look up Marketplace listings */
  meta: GitHubMetadata /* Return information about the GitHub instance */
  node?: Node | null /* Fetches an object given its ID. */
  nodes: Node[] /* Lookup nodes by a list of IDs. */
  organization?: Organization | null /* Lookup a organization by login. */
  rateLimit?: RateLimit | null /* The client&#x27;s rate limit information. */
  relay: Query /* Hack to workaround https://github.com/facebook/relay/issues/112 re-exposing the root query object */
  repository?: Repository | null /* Lookup a given repository by the owner and repository name. */
  repositoryOwner?: RepositoryOwner | null /* Lookup a repository owner (ie. either a User or an Organization) by login. */
  resource?: UniformResourceLocatable | null /* Lookup resource by a URL. */
  search: SearchResultItemConnection /* Perform a search across resources. */
  topic?: Topic | null /* Look up a topic by name. */
  user?: User | null /* Lookup a user by login. */
  viewer: User /* The currently authenticated user. */
}

/* The Code of Conduct for a repository */
export interface CodeOfConduct {
  body?: string | null /* The body of the CoC */
  key: string /* The key for the CoC */
  name: string /* The formal name of the CoC */
  url?: URI | null /* The path to the CoC */
}

/* A respository&#x27;s open source license */
export interface License {
  body: string /* The full text of the license */
  conditions: LicenseRule[] /* The conditions set by the license */
  description?: string | null /* A human-readable description of the license */
  featured: boolean /* Whether the license should be featured */
  hidden: boolean /* Whether the license should be displayed in license pickers */
  id: string
  implementation?:
    | string
    | null /* Instructions on how to implement the license */
  key: string /* The lowercased SPDX ID of the license */
  limitations: LicenseRule[] /* The limitations set by the license */
  name: string /* The license full name specified by &lt;https://spdx.org/licenses&gt; */
  nickname?: string | null /* Customary short name if applicable (e.g, GPLv3) */
  permissions: LicenseRule[] /* The permissions set by the license */
  spdxId?:
    | string
    | null /* Short identifier specified by &lt;https://spdx.org/licenses&gt; */
  url?: URI | null /* URL to the license on &lt;https://choosealicense.com&gt; */
}

/* Describes a License&#x27;s conditions, permissions, and limitations */
export interface LicenseRule {
  description: string /* A description of the rule */
  key: string /* The machine-readable rule key */
  label: string /* The human-readable rule label */
}

/* A public description of a Marketplace category. */
export interface MarketplaceCategory {
  description?: string | null /* The category&#x27;s description. */
  howItWorks?:
    | string
    | null /* The technical description of how apps listed in this category work with GitHub. */
  name: string /* The category&#x27;s name. */
  primaryListingCount: number /* How many Marketplace listings have this as their primary category. */
  resourcePath: URI /* The HTTP path for this Marketplace category. */
  secondaryListingCount: number /* How many Marketplace listings have this as their secondary category. */
  slug: string /* The short name of the category used in its URL. */
  url: URI /* The HTTP URL for this Marketplace category. */
}

/* A listing in the GitHub integration marketplace. */
export interface MarketplaceListing extends Node {
  companyUrl?: URI | null /* URL to the listing owner&#x27;s company site. */
  configurationResourcePath: URI /* The HTTP path for configuring access to the listing&#x27;s integration or OAuth app */
  configurationUrl: URI /* The HTTP URL for configuring access to the listing&#x27;s integration or OAuth app */
  documentationUrl?: URI | null /* URL to the listing&#x27;s documentation. */
  extendedDescription?:
    | string
    | null /* The listing&#x27;s detailed description. */
  extendedDescriptionHTML: HTML /* The listing&#x27;s detailed description rendered to HTML. */
  fullDescription: string /* The listing&#x27;s introductory description. */
  fullDescriptionHTML: HTML /* The listing&#x27;s introductory description rendered to HTML. */
  hasApprovalBeenRequested: boolean /* Whether this listing has been submitted for review from GitHub for approval to be displayed in the Marketplace. */
  hasPublishedFreeTrialPlans: boolean /* Does this listing have any plans with a free trial? */
  hasTermsOfService: boolean /* Does this listing have a terms of service link? */
  howItWorks?:
    | string
    | null /* A technical description of how this app works with GitHub. */
  howItWorksHTML: HTML /* The listing&#x27;s technical description rendered to HTML. */
  id: string
  installationUrl?: URI | null /* URL to install the product to the viewer&#x27;s account or organization. */
  installedForViewer: boolean /* Whether this listing&#x27;s app has been installed for the current viewer */
  isApproved: boolean /* Whether this listing has been approved for display in the Marketplace. */
  isDelisted: boolean /* Whether this listing has been removed from the Marketplace. */
  isDraft: boolean /* Whether this listing is still an editable draft that has not been submitted for review and is not publicly visible in the Marketplace. */
  isPaid: boolean /* Whether the product this listing represents is available as part of a paid plan. */
  isRejected: boolean /* Whether this listing has been rejected by GitHub for display in the Marketplace. */
  logoBackgroundColor: string /* The hex color code, without the leading &#x27;#&#x27;, for the logo background. */
  logoUrl?: URI | null /* URL for the listing&#x27;s logo image. */
  name: string /* The listing&#x27;s full name. */
  normalizedShortDescription: string /* The listing&#x27;s very short description without a trailing period or ampersands. */
  pricingUrl?: URI | null /* URL to the listing&#x27;s detailed pricing. */
  primaryCategory: MarketplaceCategory /* The category that best describes the listing. */
  privacyPolicyUrl: URI /* URL to the listing&#x27;s privacy policy. */
  resourcePath: URI /* The HTTP path for the Marketplace listing. */
  screenshotUrls: string[] /* The URLs for the listing&#x27;s screenshots. */
  secondaryCategory?: MarketplaceCategory | null /* An alternate category that describes the listing. */
  shortDescription: string /* The listing&#x27;s very short description. */
  slug: string /* The short name of the listing used in its URL. */
  statusUrl?: URI | null /* URL to the listing&#x27;s status page. */
  supportEmail?:
    | string
    | null /* An email address for support for this listing&#x27;s app. */
  supportUrl: URI /* Either a URL or an email address for support for this listing&#x27;s app. */
  termsOfServiceUrl?: URI | null /* URL to the listing&#x27;s terms of service. */
  url: URI /* The HTTP URL for the Marketplace listing. */
  viewerCanAddPlans: boolean /* Can the current viewer add plans for this Marketplace listing. */
  viewerCanApprove: boolean /* Can the current viewer approve this Marketplace listing. */
  viewerCanDelist: boolean /* Can the current viewer delist this Marketplace listing. */
  viewerCanEdit: boolean /* Can the current viewer edit this Marketplace listing. */
  viewerCanEditCategories: boolean /* Can the current viewer edit the primary and secondary category of thisMarketplace listing. */
  viewerCanEditPlans: boolean /* Can the current viewer edit the plans for this Marketplace listing. */
  viewerCanRedraft: boolean /* Can the current viewer return this Marketplace listing to draft stateso it becomes editable again. */
  viewerCanReject: boolean /* Can the current viewer reject this Marketplace listing by returning it toan editable draft state or rejecting it entirely. */
  viewerCanRequestApproval: boolean /* Can the current viewer request this listing be reviewed for display inthe Marketplace. */
  viewerHasPurchased: boolean /* Indicates whether the current user has an active subscription to this Marketplace listing. */
  viewerHasPurchasedForAllOrganizations: boolean /* Indicates if the current user has purchased a subscription to this Marketplace listingfor all of the organizations the user owns. */
  viewerIsListingAdmin: boolean /* Does the current viewer role allow them to administer this Marketplace listing. */
}

/* Look up Marketplace Listings */
export interface MarketplaceListingConnection {
  edges?: MarketplaceListingEdge[] | null /* A list of edges. */
  nodes?: MarketplaceListing[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface MarketplaceListingEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: MarketplaceListing | null /* The item at the end of the edge. */
}

/* Information about pagination in a connection. */
export interface PageInfo {
  endCursor?:
    | string
    | null /* When paginating forwards, the cursor to continue. */
  hasNextPage: boolean /* When paginating forwards, are there more items? */
  hasPreviousPage: boolean /* When paginating backwards, are there more items? */
  startCursor?:
    | string
    | null /* When paginating backwards, the cursor to continue. */
}

/* Represents information about the GitHub instance. */
export interface GitHubMetadata {
  gitHubServicesSha: string /* Returns a String that&#x27;s a SHA of &#x60;github-services&#x60; */
  gitIpAddresses: string[] /* IP addresses that users connect to for git operations */
  hookIpAddresses: string[] /* IP addresses that service hooks are sent from */
  importerIpAddresses: string[] /* IP addresses that the importer connects from */
  isPasswordAuthenticationVerifiable: boolean /* Whether or not users are verified */
  pagesIpAddresses: string[] /* IP addresses for GitHub Pages&#x27; A records */
}

/* An account on GitHub, with one or more owners, that has repositories, members and teams. */
export interface Organization
  extends Node,
    Actor,
    ProjectOwner,
    RepositoryOwner,
    UniformResourceLocatable {
  avatarUrl: URI /* A URL pointing to the organization&#x27;s public avatar. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  description?:
    | string
    | null /* The organization&#x27;s public profile description. */
  email?: string | null /* The organization&#x27;s public email. */
  id: string
  location?:
    | string
    | null /* The organization&#x27;s public profile location. */
  login: string /* The organization&#x27;s login name. */
  members: UserConnection /* A list of users who are members of this organization. */
  name?: string | null /* The organization&#x27;s public profile name. */
  newTeamResourcePath: URI /* The HTTP path creating a new team */
  newTeamUrl: URI /* The HTTP URL creating a new team */
  organizationBillingEmail?:
    | string
    | null /* The billing email for the organization. */
  pinnedRepositories: RepositoryConnection /* A list of repositories this user has pinned to their profile */
  project?: Project | null /* Find project by number. */
  projects: ProjectConnection /* A list of projects under the owner. */
  projectsResourcePath: URI /* The HTTP path listing organization&#x27;s projects */
  projectsUrl: URI /* The HTTP URL listing organization&#x27;s projects */
  repositories: RepositoryConnection /* A list of repositories that the user owns. */
  repository?: Repository | null /* Find Repository. */
  resourcePath: URI /* The HTTP path for this user */
  samlIdentityProvider?: OrganizationIdentityProvider | null /* The Organization&#x27;s SAML Identity Providers */
  team?: Team | null /* Find an organization&#x27;s team by its slug. */
  teams: TeamConnection /* A list of teams in this organization. */
  teamsResourcePath: URI /* The HTTP path listing organization&#x27;s teams */
  teamsUrl: URI /* The HTTP URL listing organization&#x27;s teams */
  url: URI /* The HTTP URL for this user */
  viewerCanAdminister: boolean /* Organization is adminable by the viewer. */
  viewerCanCreateProjects: boolean /* Can the current viewer create new projects on this owner. */
  viewerCanCreateRepositories: boolean /* Viewer can create repositories on this organization */
  viewerCanCreateTeams: boolean /* Viewer can create teams on this organization. */
  viewerIsAMember: boolean /* Viewer is a member of this organization. */
  websiteUrl?: URI | null /* The organization&#x27;s public profile URL. */
}

/* Projects manage issues, pull requests and notes within a project owner. */
export interface Project extends Node, Closable, Updatable {
  body?: string | null /* The project&#x27;s description body. */
  bodyHTML: HTML /* The projects description body rendered to HTML. */
  closed: boolean /* &#x60;true&#x60; if the object is closed (definition of closed may depend on type) */
  closedAt?: DateTime | null /* Identifies the date and time when the object was closed. */
  columns: ProjectColumnConnection /* List of columns in the project */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  creator?: Actor | null /* The actor who originally created the project. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
  name: string /* The project&#x27;s name. */
  number: number /* The project&#x27;s number. */
  owner: ProjectOwner /* The project&#x27;s owner. Currently limited to repositories and organizations. */
  pendingCards: ProjectCardConnection /* List of pending cards in this project */
  resourcePath: URI /* The HTTP path for this project */
  state: ProjectState /* Whether the project is open or closed. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this project */
  viewerCanUpdate: boolean /* Check if the current viewer can update this object. */
}

/* The connection type for ProjectColumn. */
export interface ProjectColumnConnection {
  edges?: ProjectColumnEdge[] | null /* A list of edges. */
  nodes?: ProjectColumn[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface ProjectColumnEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: ProjectColumn | null /* The item at the end of the edge. */
}

/* A column inside a project. */
export interface ProjectColumn extends Node {
  cards: ProjectCardConnection /* List of cards in the column */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
  name: string /* The project column&#x27;s name. */
  project: Project /* The project that contains this column. */
  resourcePath: URI /* The HTTP path for this project column */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this project column */
}

/* The connection type for ProjectCard. */
export interface ProjectCardConnection {
  edges?: ProjectCardEdge[] | null /* A list of edges. */
  nodes?: ProjectCard[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface ProjectCardEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: ProjectCard | null /* The item at the end of the edge. */
}

/* A card in a project. */
export interface ProjectCard extends Node {
  column?: ProjectColumn | null /* The project column this card is associated under. A card may only belong to oneproject column at a time. The column field will be null if the card is createdin a pending state and has yet to be associated with a column. Once cards areassociated with a column, they will not become pending in the future. */
  content?: ProjectCardItem | null /* The card content item */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  creator?: Actor | null /* The actor who created this card */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
  note?: string | null /* The card note */
  project: Project /* The project that contains this card. */
  projectColumn: ProjectColumn /* The column that contains this card. */
  resourcePath: URI /* The HTTP path for this card */
  state?: ProjectCardState | null /* The state of ProjectCard */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this card */
}

/* An Issue is a place to discuss ideas, enhancements, tasks, and bugs for a project. */
export interface Issue
  extends Node,
    Assignable,
    Closable,
    Comment,
    Updatable,
    UpdatableComment,
    Labelable,
    Lockable,
    Reactable,
    RepositoryNode,
    Subscribable,
    UniformResourceLocatable {
  assignees: UserConnection /* A list of Users assigned to this object. */
  author?: Actor | null /* The actor who authored the comment. */
  authorAssociation: CommentAuthorAssociation /* Author&#x27;s association with the subject of the comment. */
  body: string /* Identifies the body of the issue. */
  bodyHTML: HTML /* Identifies the body of the issue rendered to HTML. */
  bodyText: string /* Identifies the body of the issue rendered to text. */
  closed: boolean /* &#x60;true&#x60; if the object is closed (definition of closed may depend on type) */
  closedAt?: DateTime | null /* Identifies the date and time when the object was closed. */
  comments: IssueCommentConnection /* A list of comments associated with the Issue. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  createdViaEmail: boolean /* Check if this comment was created via an email reply. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  editor?: Actor | null /* The actor who edited the comment. */
  id: string
  labels?: LabelConnection | null /* A list of labels associated with the object. */
  lastEditedAt?: DateTime | null /* The moment the editor made the last edit */
  locked: boolean /* &#x60;true&#x60; if the object is locked */
  milestone?: Milestone | null /* Identifies the milestone associated with the issue. */
  number: number /* Identifies the issue number. */
  participants: UserConnection /* A list of Users that are participating in the Issue conversation. */
  projectCards: ProjectCardConnection /* List of project cards associated with this issue. */
  publishedAt?: DateTime | null /* Identifies when the comment was published at. */
  reactionGroups: ReactionGroup[] /* A list of reactions grouped by content left on the subject. */
  reactions: ReactionConnection /* A list of Reactions left on the Issue. */
  repository: Repository /* The repository associated with this node. */
  resourcePath: URI /* The HTTP path for this issue */
  state: IssueState /* Identifies the state of the issue. */
  timeline: IssueTimelineConnection /* A list of events, comments, commits, etc. associated with the issue. */
  title: string /* Identifies the issue title. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this issue */
  viewerCanReact: boolean /* Can user react to this subject */
  viewerCanSubscribe: boolean /* Check if the viewer is able to change their subscription status for the repository. */
  viewerCanUpdate: boolean /* Check if the current viewer can update this object. */
  viewerCannotUpdateReasons: CommentCannotUpdateReason[] /* Reasons why the current viewer can not update this comment. */
  viewerDidAuthor: boolean /* Did the viewer author this comment. */
  viewerSubscription: SubscriptionState /* Identifies if the viewer is watching, not watching, or ignoring the subscribable entity. */
}

/* The connection type for User. */
export interface UserConnection {
  edges?: UserEdge[] | null /* A list of edges. */
  nodes?: User[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface UserEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: User | null /* The item at the end of the edge. */
}

/* A user is an individual&#x27;s account on GitHub that owns repositories and can make new content. */
export interface User
  extends Node,
    Actor,
    RepositoryOwner,
    UniformResourceLocatable {
  avatarUrl: URI /* A URL pointing to the user&#x27;s public avatar. */
  bio?: string | null /* The user&#x27;s public profile bio. */
  bioHTML: HTML /* The user&#x27;s public profile bio as HTML. */
  commitComments: CommitCommentConnection /* A list of commit comments made by this user. */
  company?: string | null /* The user&#x27;s public profile company. */
  companyHTML: HTML /* The user&#x27;s public profile company as HTML. */
  contributedRepositories: RepositoryConnection /* A list of repositories that the user recently contributed to. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  email: string /* The user&#x27;s publicly visible profile email. */
  followers: FollowerConnection /* A list of users the given user is followed by. */
  following: FollowingConnection /* A list of users the given user is following. */
  gist?: Gist | null /* Find gist by repo name. */
  gistComments: GistCommentConnection /* A list of gist comments made by this user. */
  gists: GistConnection /* A list of the Gists the user has created. */
  id: string
  isBountyHunter: boolean /* Whether or not this user is a participant in the GitHub Security Bug Bounty. */
  isCampusExpert: boolean /* Whether or not this user is a participant in the GitHub Campus Experts Program. */
  isDeveloperProgramMember: boolean /* Whether or not this user is a GitHub Developer Program member. */
  isEmployee: boolean /* Whether or not this user is a GitHub employee. */
  isHireable: boolean /* Whether or not the user has marked themselves as for hire. */
  isSiteAdmin: boolean /* Whether or not this user is a site administrator. */
  isViewer: boolean /* Whether or not this user is the viewing user. */
  issueComments: IssueCommentConnection /* A list of issue comments made by this user. */
  issues: IssueConnection /* A list of issues assocated with this user. */
  location?: string | null /* The user&#x27;s public profile location. */
  login: string /* The username used to login. */
  name?: string | null /* The user&#x27;s public profile name. */
  organization?: Organization | null /* Find an organization by its login that the user belongs to. */
  organizations: OrganizationConnection /* A list of organizations the user belongs to. */
  pinnedRepositories: RepositoryConnection /* A list of repositories this user has pinned to their profile */
  publicKeys: PublicKeyConnection /* A list of public keys associated with this user. */
  pullRequests: PullRequestConnection /* A list of pull requests assocated with this user. */
  repositories: RepositoryConnection /* A list of repositories that the user owns. */
  repositoriesContributedTo: RepositoryConnection /* A list of repositories that the user recently contributed to. */
  repository?: Repository | null /* Find Repository. */
  resourcePath: URI /* The HTTP path for this user */
  starredRepositories: StarredRepositoryConnection /* Repositories the user has starred. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this user */
  viewerCanFollow: boolean /* Whether or not the viewer is able to follow the user. */
  viewerIsFollowing: boolean /* Whether or not this user is followed by the viewer. */
  watching: RepositoryConnection /* A list of repositories the given user is watching. */
  websiteUrl?: URI | null /* A URL pointing to the user&#x27;s public website/blog. */
}

/* A list of repositories owned by the subject. */
export interface RepositoryConnection {
  edges?: RepositoryEdge[] | null /* A list of edges. */
  nodes?: Repository[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
  totalDiskUsage: number /* The total size in kilobytes of all repositories in the connection. */
}

/* An edge in a connection. */
export interface RepositoryEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Repository | null /* The item at the end of the edge. */
}

/* A repository contains the content for a project. */
export interface Repository
  extends Node,
    ProjectOwner,
    Subscribable,
    Starrable,
    UniformResourceLocatable,
    RepositoryInfo {
  assignableUsers: UserConnection /* A list of users that can be assigned to issues in this repository. */
  codeOfConduct?: CodeOfConduct | null /* Returns the code of conduct for this repository */
  collaborators?: RepositoryCollaboratorConnection | null /* A list of collaborators associated with the repository. */
  commitComments: CommitCommentConnection /* A list of commit comments associated with the repository. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  defaultBranchRef?: Ref | null /* The Ref associated with the repository&#x27;s default branch. */
  deployKeys: DeployKeyConnection /* A list of protected branches that are on this repository. */
  deployments: DeploymentConnection /* Deployments associated with the repository */
  description?: string | null /* The description of the repository. */
  descriptionHTML: HTML /* The description of the repository rendered to HTML. */
  diskUsage?:
    | number
    | null /* The number of kilobytes this repository occupies on disk. */
  forkCount: number /* Returns how many forks there are of this repository in the whole network. */
  forks: RepositoryConnection /* A list of direct forked repositories. */
  hasIssuesEnabled: boolean /* Indicates if the repository has issues feature enabled. */
  hasWikiEnabled: boolean /* Indicates if the repository has wiki feature enabled. */
  homepageUrl?: URI | null /* The repository&#x27;s URL. */
  id: string
  isArchived: boolean /* Indicates if the repository is unmaintained. */
  isFork: boolean /* Identifies if the repository is a fork. */
  isLocked: boolean /* Indicates if the repository has been locked or not. */
  isMirror: boolean /* Identifies if the repository is a mirror. */
  isPrivate: boolean /* Identifies if the repository is private. */
  issue?: Issue | null /* Returns a single issue from the current repository by number. */
  issueOrPullRequest?: IssueOrPullRequest | null /* Returns a single issue-like object from the current repository by number. */
  issues: IssueConnection /* A list of issues that have been opened in the repository. */
  label?: Label | null /* Returns a single label by name */
  labels?: LabelConnection | null /* A list of labels associated with the repository. */
  languages?: LanguageConnection | null /* A list containing a breakdown of the language composition of the repository. */
  license?: string | null /* The license associated with the repository */
  licenseInfo?: License | null /* The license associated with the repository */
  lockReason?: RepositoryLockReason | null /* The reason the repository has been locked. */
  mentionableUsers: UserConnection /* A list of Users that can be mentioned in the context of the repository. */
  milestone?: Milestone | null /* Returns a single milestone from the current repository by number. */
  milestones?: MilestoneConnection | null /* A list of milestones associated with the repository. */
  mirrorUrl?: URI | null /* The repository&#x27;s original mirror URL. */
  name: string /* The name of the repository. */
  nameWithOwner: string /* The repository&#x27;s name with owner. */
  object?: GitObject | null /* A Git object in the repository */
  owner: RepositoryOwner /* The User owner of the repository. */
  parent?: Repository | null /* The repository parent, if this is a fork. */
  primaryLanguage?: Language | null /* The primary language of the repository&#x27;s code. */
  project?: Project | null /* Find project by number. */
  projects: ProjectConnection /* A list of projects under the owner. */
  projectsResourcePath: URI /* The HTTP path listing repository&#x27;s projects */
  projectsUrl: URI /* The HTTP URL listing repository&#x27;s projects */
  protectedBranches: ProtectedBranchConnection /* A list of protected branches that are on this repository. */
  pullRequest?: PullRequest | null /* Returns a single pull request from the current repository by number. */
  pullRequests: PullRequestConnection /* A list of pull requests that have been opened in the repository. */
  pushedAt?: DateTime | null /* Identifies when the repository was last pushed to. */
  ref?: Ref | null /* Fetch a given ref from the repository */
  refs?: RefConnection | null /* Fetch a list of refs from the repository */
  release?: Release | null /* Lookup a single release given various criteria. */
  releases: ReleaseConnection /* List of releases which are dependent on this repository. */
  repositoryTopics: RepositoryTopicConnection /* A list of applied repository-topic associations for this repository. */
  resourcePath: URI /* The HTTP path for this repository */
  shortDescriptionHTML: HTML /* A description of the repository, rendered to HTML without any links in it. */
  sshUrl: GitSSHRemote /* The SSH URL to clone this repository */
  stargazers: StargazerConnection /* A list of users who have starred this starrable. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this repository */
  viewerCanAdminister: boolean /* Indicates whether the viewer has admin permissions on this repository. */
  viewerCanCreateProjects: boolean /* Can the current viewer create new projects on this owner. */
  viewerCanSubscribe: boolean /* Check if the viewer is able to change their subscription status for the repository. */
  viewerCanUpdateTopics: boolean /* Indicates whether the viewer can update the topics of this repository. */
  viewerHasStarred: boolean /* Returns a boolean indicating whether the viewing user has starred this starrable. */
  viewerSubscription: SubscriptionState /* Identifies if the viewer is watching, not watching, or ignoring the subscribable entity. */
  watchers: UserConnection /* A list of users watching the repository. */
}

/* The connection type for User. */
export interface StargazerConnection {
  edges?: StargazerEdge[] | null /* A list of edges. */
  nodes?: User[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* Represents a user that&#x27;s starred a repository. */
export interface StargazerEdge {
  cursor: string
  node: User
  starredAt: DateTime /* Identifies when the item was starred. */
}

/* The connection type for User. */
export interface RepositoryCollaboratorConnection {
  edges?: RepositoryCollaboratorEdge[] | null /* A list of edges. */
  nodes?: User[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* Represents a user who is a collaborator of a repository. */
export interface RepositoryCollaboratorEdge {
  cursor: string
  node: User
  permission: RepositoryPermission /* The permission the user has on the repository. */
}

/* The connection type for CommitComment. */
export interface CommitCommentConnection {
  edges?: CommitCommentEdge[] | null /* A list of edges. */
  nodes?: CommitComment[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface CommitCommentEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: CommitComment | null /* The item at the end of the edge. */
}

/* Represents a comment on a given Commit. */
export interface CommitComment
  extends Node,
    Comment,
    Deletable,
    Updatable,
    UpdatableComment,
    Reactable,
    RepositoryNode {
  author?: Actor | null /* The actor who authored the comment. */
  authorAssociation: CommentAuthorAssociation /* Author&#x27;s association with the subject of the comment. */
  body: string /* Identifies the comment body. */
  bodyHTML: HTML /* Identifies the comment body rendered to HTML. */
  commit?: Commit | null /* Identifies the commit associated with the comment, if the commit exists. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  createdViaEmail: boolean /* Check if this comment was created via an email reply. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  editor?: Actor | null /* The actor who edited the comment. */
  id: string
  lastEditedAt?: DateTime | null /* The moment the editor made the last edit */
  path?:
    | string
    | null /* Identifies the file path associated with the comment. */
  position?:
    | number
    | null /* Identifies the line position associated with the comment. */
  publishedAt?: DateTime | null /* Identifies when the comment was published at. */
  reactionGroups: ReactionGroup[] /* A list of reactions grouped by content left on the subject. */
  reactions: ReactionConnection /* A list of Reactions left on the Issue. */
  repository: Repository /* The repository associated with this node. */
  resourcePath: URI /* The HTTP path permalink for this commit comment. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL permalink for this commit comment. */
  viewerCanDelete: boolean /* Check if the current viewer can delete this object. */
  viewerCanReact: boolean /* Can user react to this subject */
  viewerCanUpdate: boolean /* Check if the current viewer can update this object. */
  viewerCannotUpdateReasons: CommentCannotUpdateReason[] /* Reasons why the current viewer can not update this comment. */
  viewerDidAuthor: boolean /* Did the viewer author this comment. */
}

/* A group of emoji reactions to a particular piece of content. */
export interface ReactionGroup {
  content: ReactionContent /* Identifies the emoji reaction. */
  createdAt?: DateTime | null /* Identifies when the reaction was created. */
  subject: Reactable /* The subject that was reacted to. */
  users: ReactingUserConnection /* Users who have reacted to the reaction subject with the emotion represented by this reaction group */
  viewerHasReacted: boolean /* Whether or not the authenticated user has left a reaction on the subject. */
}

/* The connection type for User. */
export interface ReactingUserConnection {
  edges?: ReactingUserEdge[] | null /* A list of edges. */
  nodes?: User[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* Represents a user that&#x27;s made a reaction. */
export interface ReactingUserEdge {
  cursor: string
  node: User
  reactedAt: DateTime /* The moment when the user made the reaction. */
}

/* A list of reactions that have been left on the subject. */
export interface ReactionConnection {
  edges?: ReactionEdge[] | null /* A list of edges. */
  nodes?: Reaction[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
  viewerHasReacted: boolean /* Whether or not the authenticated user has left a reaction on the subject. */
}

/* An edge in a connection. */
export interface ReactionEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Reaction | null /* The item at the end of the edge. */
}

/* An emoji reaction to a particular piece of content. */
export interface Reaction extends Node {
  content: ReactionContent /* Identifies the emoji reaction. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
  reactable: Reactable /* The reactable piece of content */
  user?: User | null /* Identifies the user who created this reaction. */
}

/* Represents a Git commit. */
export interface Commit extends Node, GitObject, Subscribable {
  abbreviatedOid: string /* An abbreviated version of the Git object ID */
  additions: number /* The number of additions in this commit. */
  author?: GitActor | null /* Authorship details of the commit. */
  authoredByCommitter: boolean /* Check if the committer and the author match. */
  authoredDate: DateTime /* The datetime when this commit was authored. */
  blame: Blame /* Fetches &#x60;git blame&#x60; information. */
  changedFiles: number /* The number of changed files in this commit. */
  comments: CommitCommentConnection /* Comments made on the commit. */
  commitResourcePath: URI /* The HTTP path for this Git object */
  commitUrl: URI /* The HTTP URL for this Git object */
  committedDate: DateTime /* The datetime when this commit was committed. */
  committedViaWeb: boolean /* Check if commited via GitHub web UI. */
  committer?: GitActor | null /* Committership details of the commit. */
  deletions: number /* The number of deletions in this commit. */
  history: CommitHistoryConnection /* The linear commit history starting from (and including) this commit, in the same order as &#x60;git log&#x60;. */
  id: string
  message: string /* The Git commit message */
  messageBody: string /* The Git commit message body */
  messageBodyHTML: HTML /* The commit message body rendered to HTML. */
  messageHeadline: string /* The Git commit message headline */
  messageHeadlineHTML: HTML /* The commit message headline rendered to HTML. */
  oid: GitObjectID /* The Git object ID */
  parents: CommitConnection /* The parents of a commit. */
  pushedDate?: DateTime | null /* The datetime when this commit was pushed. */
  repository: Repository /* The Repository this commit belongs to */
  resourcePath: URI /* The HTTP path for this commit */
  signature?: GitSignature | null /* Commit signing information, if present. */
  status?: Status | null /* Status information for this commit */
  tarballUrl: URI /* Returns a URL to download a tarball archive for a repository.                      Note: For private repositories, these links are temporary and expire after five minutes. */
  tree: Tree /* Commit&#x27;s root Tree */
  treeResourcePath: URI /* The HTTP path for the tree of this commit */
  treeUrl: URI /* The HTTP URL for the tree of this commit */
  url: URI /* The HTTP URL for this commit */
  viewerCanSubscribe: boolean /* Check if the viewer is able to change their subscription status for the repository. */
  viewerSubscription: SubscriptionState /* Identifies if the viewer is watching, not watching, or ignoring the subscribable entity. */
  zipballUrl: URI /* Returns a URL to download a zipball archive for a repository.                      Note: For private repositories, these links are temporary and expire after five minutes. */
}

/* Represents an actor in a Git commit (ie. an author or committer). */
export interface GitActor {
  avatarUrl: URI /* A URL pointing to the author&#x27;s public avatar. */
  date?: GitTimestamp | null /* The timestamp of the Git action (authoring or committing). */
  email?: string | null /* The email in the Git commit. */
  name?: string | null /* The name in the Git commit. */
  user?: User | null /* The GitHub user corresponding to the email field. Null if no such user exists. */
}

/* Represents a Git blame. */
export interface Blame {
  ranges: BlameRange[] /* The list of ranges from a Git blame. */
}

/* Represents a range of information from a Git blame. */
export interface BlameRange {
  age: number /* Identifies the recency of the change, from 1 (new) to 10 (old). This is calculated as a 2-quantile and determines the length of distance between the median age of all the changes in the file and the recency of the current range&#x27;s change. */
  commit: Commit /* Identifies the line author */
  endingLine: number /* The ending line for the range */
  startingLine: number /* The starting line for the range */
}

/* The connection type for Commit. */
export interface CommitHistoryConnection {
  edges?: CommitEdge[] | null
  nodes?: Commit[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface CommitEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Commit | null /* The item at the end of the edge. */
}

/* The connection type for Commit. */
export interface CommitConnection {
  edges?: CommitEdge[] | null /* A list of edges. */
  nodes?: Commit[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* Represents a commit status. */
export interface Status extends Node {
  commit?: Commit | null /* The commit this status is attached to. */
  context?: StatusContext | null /* Looks up an individual status context by context name. */
  contexts: StatusContext[] /* The individual status contexts for this commit. */
  id: string
  state: StatusState /* The combined commit status. */
}

/* Represents an individual commit status context */
export interface StatusContext extends Node {
  commit?: Commit | null /* This commit this status context is attached to. */
  context: string /* The name of this status context. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  creator?: Actor | null /* The actor who created this status context. */
  description?: string | null /* The description for this status context. */
  id: string
  state: StatusState /* The state of this status context. */
  targetUrl?: URI | null /* The URL for this status context. */
}

/* Represents a Git tree. */
export interface Tree extends Node, GitObject {
  abbreviatedOid: string /* An abbreviated version of the Git object ID */
  commitResourcePath: URI /* The HTTP path for this Git object */
  commitUrl: URI /* The HTTP URL for this Git object */
  entries: TreeEntry[] /* A list of tree entries. */
  id: string
  oid: GitObjectID /* The Git object ID */
  repository: Repository /* The Repository the Git object belongs to */
}

/* Represents a Git tree entry. */
export interface TreeEntry {
  mode: number /* Entry file mode. */
  name: string /* Entry file name. */
  object?: GitObject | null /* Entry file object. */
  oid: GitObjectID /* Entry file Git object ID. */
  repository: Repository /* The Repository the tree entry belongs to */
  type: string /* Entry file type. */
}

/* Represents a Git reference. */
export interface Ref extends Node {
  associatedPullRequests: PullRequestConnection /* A list of pull requests with this ref as the head ref. */
  id: string
  name: string /* The ref name. */
  prefix: string /* The ref&#x27;s prefix, such as &#x60;refs/heads/&#x60; or &#x60;refs/tags/&#x60;. */
  repository: Repository /* The repository the ref belongs to. */
  target: GitObject /* The object the ref points to. */
}

/* The connection type for PullRequest. */
export interface PullRequestConnection {
  edges?: PullRequestEdge[] | null /* A list of edges. */
  nodes?: PullRequest[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface PullRequestEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: PullRequest | null /* The item at the end of the edge. */
}

/* A repository pull request. */
export interface PullRequest
  extends Node,
    Assignable,
    Closable,
    Comment,
    Updatable,
    UpdatableComment,
    Labelable,
    Lockable,
    Reactable,
    RepositoryNode,
    Subscribable,
    UniformResourceLocatable {
  additions: number /* The number of additions in this pull request. */
  assignees: UserConnection /* A list of Users assigned to this object. */
  author?: Actor | null /* The actor who authored the comment. */
  authorAssociation: CommentAuthorAssociation /* Author&#x27;s association with the subject of the comment. */
  baseRef?: Ref | null /* Identifies the base Ref associated with the pull request. */
  baseRefName: string /* Identifies the name of the base Ref associated with the pull request, even if the ref has been deleted. */
  body: string /* Identifies the body of the pull request. */
  bodyHTML: HTML /* Identifies the body of the pull request rendered to HTML. */
  bodyText: string /* Identifies the body of the pull request rendered to text. */
  changedFiles: number /* The number of changed files in this pull request. */
  closed: boolean /* &#x60;true&#x60; if the pull request is closed */
  closedAt?: DateTime | null /* Identifies the date and time when the object was closed. */
  comments: IssueCommentConnection /* A list of comments associated with the pull request. */
  commits: PullRequestCommitConnection /* A list of commits present in this pull request&#x27;s head branch not present in the base branch. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  createdViaEmail: boolean /* Check if this comment was created via an email reply. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  deletions: number /* The number of deletions in this pull request. */
  editor?: Actor | null /* The actor who edited this pull request&#x27;s body. */
  headRef?: Ref | null /* Identifies the head Ref associated with the pull request. */
  headRefName: string /* Identifies the name of the head Ref associated with the pull request, even if the ref has been deleted. */
  headRepository?: Repository | null /* The repository associated with this pull request&#x27;s head Ref. */
  headRepositoryOwner?: RepositoryOwner | null /* The owner of the repository associated with this pull request&#x27;s head Ref. */
  id: string
  isCrossRepository: boolean /* The head and base repositories are different. */
  labels?: LabelConnection | null /* A list of labels associated with the object. */
  lastEditedAt?: DateTime | null /* The moment the editor made the last edit */
  locked: boolean /* &#x60;true&#x60; if the pull request is locked */
  mergeCommit?: Commit | null /* The commit that was created when this pull request was merged. */
  mergeable: MergeableState /* Whether or not the pull request can be merged based on the existence of merge conflicts. */
  merged: boolean /* Whether or not the pull request was merged. */
  mergedAt?: DateTime | null /* The date and time that the pull request was merged. */
  milestone?: Milestone | null /* Identifies the milestone associated with the pull request. */
  number: number /* Identifies the pull request number. */
  participants: UserConnection /* A list of Users that are participating in the Pull Request conversation. */
  potentialMergeCommit?: Commit | null /* The commit that GitHub automatically generated to test if this pull request could be merged. This field will not return a value if the pull request is merged, or if the test merge commit is still being generated. See the &#x60;mergeable&#x60; field for more details on the mergeability of the pull request. */
  projectCards: ProjectCardConnection /* List of project cards associated with this pull request. */
  publishedAt?: DateTime | null /* Identifies when the comment was published at. */
  reactionGroups: ReactionGroup[] /* A list of reactions grouped by content left on the subject. */
  reactions: ReactionConnection /* A list of Reactions left on the Issue. */
  repository: Repository /* The repository associated with this node. */
  resourcePath: URI /* The HTTP path for this pull request. */
  revertResourcePath: URI /* The HTTP path for reverting this pull request. */
  revertUrl: URI /* The HTTP URL for reverting this pull request. */
  reviewRequests?: ReviewRequestConnection | null /* A list of review requests associated with the pull request. */
  reviews?: PullRequestReviewConnection | null /* A list of reviews associated with the pull request. */
  state: PullRequestState /* Identifies the state of the pull request. */
  suggestedReviewers: SuggestedReviewer[] /* A list of reviewer suggestions based on commit history and past review comments. */
  timeline: PullRequestTimelineConnection /* A list of events, comments, commits, etc. associated with the pull request. */
  title: string /* Identifies the pull request title. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this pull request. */
  viewerCanReact: boolean /* Can user react to this subject */
  viewerCanSubscribe: boolean /* Check if the viewer is able to change their subscription status for the repository. */
  viewerCanUpdate: boolean /* Check if the current viewer can update this object. */
  viewerCannotUpdateReasons: CommentCannotUpdateReason[] /* Reasons why the current viewer can not update this comment. */
  viewerDidAuthor: boolean /* Did the viewer author this comment. */
  viewerSubscription: SubscriptionState /* Identifies if the viewer is watching, not watching, or ignoring the subscribable entity. */
}

/* The connection type for Label. */
export interface LabelConnection {
  edges?: LabelEdge[] | null /* A list of edges. */
  nodes?: Label[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface LabelEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Label | null /* The item at the end of the edge. */
}

/* A label for categorizing Issues or Milestones with a given Repository. */
export interface Label extends Node {
  color: string /* Identifies the label color. */
  id: string
  issues: IssueConnection /* A list of issues associated with this label. */
  name: string /* Identifies the label name. */
  pullRequests: PullRequestConnection /* A list of pull requests associated with this label. */
  repository: Repository /* The repository associated with this label. */
}

/* The connection type for Issue. */
export interface IssueConnection {
  edges?: IssueEdge[] | null /* A list of edges. */
  nodes?: Issue[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface IssueEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Issue | null /* The item at the end of the edge. */
}

/* The connection type for IssueComment. */
export interface IssueCommentConnection {
  edges?: IssueCommentEdge[] | null /* A list of edges. */
  nodes?: IssueComment[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface IssueCommentEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: IssueComment | null /* The item at the end of the edge. */
}

/* Represents a comment on an Issue. */
export interface IssueComment
  extends Node,
    Comment,
    Deletable,
    Updatable,
    UpdatableComment,
    Reactable,
    RepositoryNode {
  author?: Actor | null /* The actor who authored the comment. */
  authorAssociation: CommentAuthorAssociation /* Author&#x27;s association with the subject of the comment. */
  body: string /* Identifies the comment body. */
  bodyHTML: HTML /* The comment body rendered to HTML. */
  bodyText: string /* Identifies the body of the issue rendered to text. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  createdViaEmail: boolean /* Check if this comment was created via an email reply. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  editor?: Actor | null /* The actor who edited the comment. */
  id: string
  issue: Issue /* Identifies the issue associated with the comment. */
  lastEditedAt?: DateTime | null /* The moment the editor made the last edit */
  publishedAt?: DateTime | null /* Identifies when the comment was published at. */
  pullRequest?: PullRequest | null /* Returns the pull request associated with the comment, if this comment was made on apull request. */
  reactionGroups: ReactionGroup[] /* A list of reactions grouped by content left on the subject. */
  reactions: ReactionConnection /* A list of Reactions left on the Issue. */
  repository: Repository /* The repository associated with this node. */
  resourcePath: URI /* The HTTP path for this issue comment */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this issue comment */
  viewerCanDelete: boolean /* Check if the current viewer can delete this object. */
  viewerCanReact: boolean /* Can user react to this subject */
  viewerCanUpdate: boolean /* Check if the current viewer can update this object. */
  viewerCannotUpdateReasons: CommentCannotUpdateReason[] /* Reasons why the current viewer can not update this comment. */
  viewerDidAuthor: boolean /* Did the viewer author this comment. */
}

/* The connection type for PullRequestCommit. */
export interface PullRequestCommitConnection {
  edges?: PullRequestCommitEdge[] | null /* A list of edges. */
  nodes?: PullRequestCommit[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface PullRequestCommitEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: PullRequestCommit | null /* The item at the end of the edge. */
}

/* Represents a Git commit part of a pull request. */
export interface PullRequestCommit extends Node, UniformResourceLocatable {
  commit: Commit /* The Git commit object */
  id: string
  pullRequest: PullRequest /* The pull request this commit belongs to */
  resourcePath: URI /* The HTTP path for this pull request commit */
  url: URI /* The HTTP URL for this pull request commit */
}

/* Represents a Milestone object on a given repository. */
export interface Milestone extends Node, Closable, UniformResourceLocatable {
  closed: boolean /* &#x60;true&#x60; if the object is closed (definition of closed may depend on type) */
  closedAt?: DateTime | null /* Identifies the date and time when the object was closed. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  creator?: Actor | null /* Identifies the actor who created the milestone. */
  description?: string | null /* Identifies the description of the milestone. */
  dueOn?: DateTime | null /* Identifies the due date of the milestone. */
  id: string
  issues: IssueConnection /* A list of issues associated with the milestone. */
  number: number /* Identifies the number of the milestone. */
  repository: Repository /* The repository associated with this milestone. */
  resourcePath: URI /* The HTTP path for this milestone */
  state: MilestoneState /* Identifies the state of the milestone. */
  title: string /* Identifies the title of the milestone. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this milestone */
}

/* The connection type for ReviewRequest. */
export interface ReviewRequestConnection {
  edges?: ReviewRequestEdge[] | null /* A list of edges. */
  nodes?: ReviewRequest[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface ReviewRequestEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: ReviewRequest | null /* The item at the end of the edge. */
}

/* A request for a user to review a pull request. */
export interface ReviewRequest extends Node {
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
  pullRequest: PullRequest /* Identifies the pull request associated with this review request. */
  requestedReviewer?: RequestedReviewer | null /* The reviewer that is requested. */
  reviewer?: User | null /* Identifies the author associated with this review request. */
}

/* A team of users in an organization. */
export interface Team extends Node, Subscribable {
  ancestors: TeamConnection /* A list of teams that are ancestors of this team. */
  childTeams: TeamConnection /* List of child teams belonging to this team */
  combinedSlug: string /* The slug corresponding to the organization and team. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  description?: string | null /* The description of the team. */
  editTeamResourcePath: URI /* The HTTP path for editing this team */
  editTeamUrl: URI /* The HTTP URL for editing this team */
  id: string
  invitations?: OrganizationInvitationConnection | null /* A list of pending invitations for users to this team */
  members: TeamMemberConnection /* A list of users who are members of this team. */
  membersResourcePath: URI /* The HTTP path for the team&#x27; members */
  membersUrl: URI /* The HTTP URL for the team&#x27; members */
  name: string /* The name of the team. */
  newTeamResourcePath: URI /* The HTTP path creating a new team */
  newTeamUrl: URI /* The HTTP URL creating a new team */
  organization: Organization /* The organization that owns this team. */
  parentTeam?: Team | null /* The parent team of the team. */
  privacy: TeamPrivacy /* The level of privacy the team has. */
  repositories: TeamRepositoryConnection /* A list of repositories this team has access to. */
  repositoriesResourcePath: URI /* The HTTP path for this team&#x27;s repositories */
  repositoriesUrl: URI /* The HTTP URL for this team&#x27;s repositories */
  resourcePath: URI /* The HTTP path for this team */
  slug: string /* The slug corresponding to the team. */
  teamsResourcePath: URI /* The HTTP path for this team&#x27;s teams */
  teamsUrl: URI /* The HTTP URL for this team&#x27;s teams */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this team */
  viewerCanAdminister: boolean /* Team is adminable by the viewer. */
  viewerCanSubscribe: boolean /* Check if the viewer is able to change their subscription status for the repository. */
  viewerSubscription: SubscriptionState /* Identifies if the viewer is watching, not watching, or ignoring the subscribable entity. */
}

/* The connection type for Team. */
export interface TeamConnection {
  edges?: TeamEdge[] | null /* A list of edges. */
  nodes?: Team[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface TeamEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Team | null /* The item at the end of the edge. */
}

/* The connection type for OrganizationInvitation. */
export interface OrganizationInvitationConnection {
  edges?: OrganizationInvitationEdge[] | null /* A list of edges. */
  nodes?: OrganizationInvitation[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface OrganizationInvitationEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: OrganizationInvitation | null /* The item at the end of the edge. */
}

/* An Invitation for a user to an organization. */
export interface OrganizationInvitation extends Node {
  email?:
    | string
    | null /* The email address of the user invited to the organization. */
  id: string
  invitationType: OrganizationInvitationType /* The type of invitation that was sent (e.g. email, user). */
  invitee?: User | null /* The user who was invited to the organization. */
  inviter: User /* The user who created the invitation. */
  role: OrganizationInvitationRole /* The user&#x27;s pending role in the organization (e.g. member, owner). */
}

/* The connection type for User. */
export interface TeamMemberConnection {
  edges?: TeamMemberEdge[] | null /* A list of edges. */
  nodes?: User[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* Represents a user who is a member of a team. */
export interface TeamMemberEdge {
  cursor: string
  memberAccessResourcePath: URI /* The HTTP path to the organization&#x27;s member access page. */
  memberAccessUrl: URI /* The HTTP URL to the organization&#x27;s member access page. */
  node: User
  role: TeamMemberRole /* The role the member has on the team. */
}

/* The connection type for Repository. */
export interface TeamRepositoryConnection {
  edges?: TeamRepositoryEdge[] | null /* A list of edges. */
  nodes?: Repository[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* Represents a team repository. */
export interface TeamRepositoryEdge {
  cursor: string
  node: Repository
  permission: RepositoryPermission /* The permission level the team has on the repository */
}

/* The connection type for PullRequestReview. */
export interface PullRequestReviewConnection {
  edges?: PullRequestReviewEdge[] | null /* A list of edges. */
  nodes?: PullRequestReview[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface PullRequestReviewEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: PullRequestReview | null /* The item at the end of the edge. */
}

/* A review object for a given pull request. */
export interface PullRequestReview
  extends Node,
    Comment,
    Deletable,
    Updatable,
    UpdatableComment,
    RepositoryNode {
  author?: Actor | null /* The actor who authored the comment. */
  authorAssociation: CommentAuthorAssociation /* Author&#x27;s association with the subject of the comment. */
  body: string /* Identifies the pull request review body. */
  bodyHTML: HTML /* The body of this review rendered to HTML. */
  bodyText: string /* The body of this review rendered as plain text. */
  comments: PullRequestReviewCommentConnection /* A list of review comments for the current pull request review. */
  commit?: Commit | null /* Identifies the commit associated with this pull request review. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  createdViaEmail: boolean /* Check if this comment was created via an email reply. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  editor?: Actor | null /* The actor who edited the comment. */
  id: string
  lastEditedAt?: DateTime | null /* The moment the editor made the last edit */
  publishedAt?: DateTime | null /* Identifies when the comment was published at. */
  pullRequest: PullRequest /* Identifies the pull request associated with this pull request review. */
  repository: Repository /* The repository associated with this node. */
  resourcePath: URI /* The HTTP path permalink for this PullRequestReview. */
  state: PullRequestReviewState /* Identifies the current state of the pull request review. */
  submittedAt?: DateTime | null /* Identifies when the Pull Request Review was submitted */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL permalink for this PullRequestReview. */
  viewerCanDelete: boolean /* Check if the current viewer can delete this object. */
  viewerCanUpdate: boolean /* Check if the current viewer can update this object. */
  viewerCannotUpdateReasons: CommentCannotUpdateReason[] /* Reasons why the current viewer can not update this comment. */
  viewerDidAuthor: boolean /* Did the viewer author this comment. */
}

/* The connection type for PullRequestReviewComment. */
export interface PullRequestReviewCommentConnection {
  edges?: PullRequestReviewCommentEdge[] | null /* A list of edges. */
  nodes?: PullRequestReviewComment[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface PullRequestReviewCommentEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: PullRequestReviewComment | null /* The item at the end of the edge. */
}

/* A review comment associated with a given repository pull request. */
export interface PullRequestReviewComment
  extends Node,
    Comment,
    Deletable,
    Updatable,
    UpdatableComment,
    Reactable,
    RepositoryNode {
  author?: Actor | null /* The actor who authored the comment. */
  authorAssociation: CommentAuthorAssociation /* Author&#x27;s association with the subject of the comment. */
  body: string /* The comment body of this review comment. */
  bodyHTML: HTML /* The comment body of this review comment rendered to HTML. */
  bodyText: string /* The comment body of this review comment rendered as plain text. */
  commit: Commit /* Identifies the commit associated with the comment. */
  createdAt: DateTime /* Identifies when the comment was created. */
  createdViaEmail: boolean /* Check if this comment was created via an email reply. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  diffHunk: string /* The diff hunk to which the comment applies. */
  draftedAt: DateTime /* Identifies when the comment was created in a draft state. */
  editor?: Actor | null /* The actor who edited the comment. */
  id: string
  lastEditedAt?: DateTime | null /* The moment the editor made the last edit */
  originalCommit?: Commit | null /* Identifies the original commit associated with the comment. */
  originalPosition: number /* The original line index in the diff to which the comment applies. */
  path: string /* The path to which the comment applies. */
  position?:
    | number
    | null /* The line index in the diff to which the comment applies. */
  publishedAt?: DateTime | null /* Identifies when the comment was published at. */
  pullRequest: PullRequest /* The pull request associated with this review comment. */
  pullRequestReview?: PullRequestReview | null /* The pull request review associated with this review comment. */
  reactionGroups: ReactionGroup[] /* A list of reactions grouped by content left on the subject. */
  reactions: ReactionConnection /* A list of Reactions left on the Issue. */
  replyTo?: PullRequestReviewComment | null /* The comment this is a reply to. */
  repository: Repository /* The repository associated with this node. */
  resourcePath: URI /* The HTTP path permalink for this review comment. */
  updatedAt: DateTime /* Identifies when the comment was last updated. */
  url: URI /* The HTTP URL permalink for this review comment. */
  viewerCanDelete: boolean /* Check if the current viewer can delete this object. */
  viewerCanReact: boolean /* Can user react to this subject */
  viewerCanUpdate: boolean /* Check if the current viewer can update this object. */
  viewerCannotUpdateReasons: CommentCannotUpdateReason[] /* Reasons why the current viewer can not update this comment. */
  viewerDidAuthor: boolean /* Did the viewer author this comment. */
}

/* A suggestion to review a pull request based on a user&#x27;s commit history and review comments. */
export interface SuggestedReviewer {
  isAuthor: boolean /* Is this suggestion based on past commits? */
  isCommenter: boolean /* Is this suggestion based on past review comments? */
  reviewer: User /* Identifies the user suggested to review the pull request. */
}

/* The connection type for PullRequestTimelineItem. */
export interface PullRequestTimelineConnection {
  edges?: PullRequestTimelineItemEdge[] | null /* A list of edges. */
  nodes?: PullRequestTimelineItem[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface PullRequestTimelineItemEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: PullRequestTimelineItem | null /* The item at the end of the edge. */
}

/* A thread of comments on a commit. */
export interface CommitCommentThread extends Node, RepositoryNode {
  comments: CommitCommentConnection /* The comments that exist in this thread. */
  commit: Commit /* The commit the comments were made on. */
  id: string
  path?: string | null /* The file the comments were made on. */
  position?:
    | number
    | null /* The position in the diff for the commit that the comment was made on. */
  repository: Repository /* The repository associated with this node. */
}

/* A threaded list of comments for a given pull request. */
export interface PullRequestReviewThread extends Node {
  comments: PullRequestReviewCommentConnection /* A list of pull request comments associated with the thread. */
  id: string
  pullRequest: PullRequest /* Identifies the pull request associated with this thread. */
  repository: Repository /* Identifies the repository associated with this thread. */
}

/* Represents a &#x27;closed&#x27; event on any &#x60;Closable&#x60;. */
export interface ClosedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  closable: Closable /* Object that was closed. */
  commit?: Commit | null /* Identifies the commit associated with the &#x27;closed&#x27; event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
}

/* Represents a &#x27;reopened&#x27; event on any &#x60;Closable&#x60;. */
export interface ReopenedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  closable: Closable /* Object that was reopened. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
}

/* Represents a &#x27;subscribed&#x27; event on a given &#x60;Subscribable&#x60;. */
export interface SubscribedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  subscribable: Subscribable /* Object referenced by event. */
}

/* Represents an &#x27;unsubscribed&#x27; event on a given &#x60;Subscribable&#x60;. */
export interface UnsubscribedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  subscribable: Subscribable /* Object referenced by event. */
}

/* Represents a &#x27;merged&#x27; event on a given pull request. */
export interface MergedEvent extends Node, UniformResourceLocatable {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  commit?: Commit | null /* Identifies the commit associated with the &#x60;merge&#x60; event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  mergeRef?: Ref | null /* Identifies the Ref associated with the &#x60;merge&#x60; event. */
  mergeRefName: string /* Identifies the name of the Ref associated with the &#x60;merge&#x60; event. */
  pullRequest: PullRequest /* PullRequest referenced by event. */
  resourcePath: URI /* The HTTP path for this merged event. */
  url: URI /* The HTTP URL for this merged event. */
}

/* Represents a &#x27;referenced&#x27; event on a given &#x60;ReferencedSubject&#x60;. */
export interface ReferencedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  commit?: Commit | null /* Identifies the commit associated with the &#x27;referenced&#x27; event. */
  commitRepository: Repository /* Identifies the repository associated with the &#x27;referenced&#x27; event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  isCrossReference: boolean /* Reference originated in a different repository. */
  isCrossRepository: boolean /* Reference originated in a different repository. */
  isDirectReference: boolean /* Checks if the commit message itself references the subject. Can be false in the case of a commit comment reference. */
  subject: ReferencedSubject /* Object referenced by event. */
}

/* Represents a mention made by one issue or pull request to another. */
export interface CrossReferencedEvent extends Node, UniformResourceLocatable {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  isCrossRepository: boolean /* Reference originated in a different repository. */
  referencedAt: DateTime /* Identifies when the reference was made. */
  resourcePath: URI /* The HTTP path for this pull request. */
  source: ReferencedSubject /* Issue or pull request that made the reference. */
  target: ReferencedSubject /* Issue or pull request to which the reference was made. */
  url: URI /* The HTTP URL for this pull request. */
  willCloseTarget: boolean /* Checks if the target will be closed when the source is merged. */
}

/* Represents an &#x27;assigned&#x27; event on any assignable object. */
export interface AssignedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  assignable: Assignable /* Identifies the assignable associated with the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  user?: User | null /* Identifies the user who was assigned. */
}

/* Represents an &#x27;unassigned&#x27; event on any assignable object. */
export interface UnassignedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  assignable: Assignable /* Identifies the assignable associated with the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  user?: User | null /* Identifies the subject (user) who was unassigned. */
}

/* Represents a &#x27;labeled&#x27; event on a given issue or pull request. */
export interface LabeledEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  label: Label /* Identifies the label associated with the &#x27;labeled&#x27; event. */
  labelable: Labelable /* Identifies the &#x60;Labelable&#x60; associated with the event. */
}

/* Represents an &#x27;unlabeled&#x27; event on a given issue or pull request. */
export interface UnlabeledEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  label: Label /* Identifies the label associated with the &#x27;unlabeled&#x27; event. */
  labelable: Labelable /* Identifies the &#x60;Labelable&#x60; associated with the event. */
}

/* Represents a &#x27;milestoned&#x27; event on a given issue or pull request. */
export interface MilestonedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  milestoneTitle: string /* Identifies the milestone title associated with the &#x27;milestoned&#x27; event. */
  subject: MilestoneItem /* Object referenced by event. */
}

/* Represents a &#x27;demilestoned&#x27; event on a given issue or pull request. */
export interface DemilestonedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  milestoneTitle: string /* Identifies the milestone title associated with the &#x27;demilestoned&#x27; event. */
  subject: MilestoneItem /* Object referenced by event. */
}

/* Represents a &#x27;renamed&#x27; event on a given issue or pull request */
export interface RenamedTitleEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  currentTitle: string /* Identifies the current title of the issue or pull request. */
  id: string
  previousTitle: string /* Identifies the previous title of the issue or pull request. */
  subject: RenamedTitleSubject /* Subject that was renamed. */
}

/* Represents a &#x27;locked&#x27; event on a given issue or pull request. */
export interface LockedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  lockable: Lockable /* Object that was locked. */
}

/* Represents an &#x27;unlocked&#x27; event on a given issue or pull request. */
export interface UnlockedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  lockable: Lockable /* Object that was unlocked. */
}

/* Represents a &#x27;deployed&#x27; event on a given pull request. */
export interface DeployedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  deployment: Deployment /* The deployment associated with the &#x27;deployed&#x27; event. */
  id: string
  pullRequest: PullRequest /* PullRequest referenced by event. */
  ref?: Ref | null /* The ref associated with the &#x27;deployed&#x27; event. */
}

/* Represents triggered deployment instance. */
export interface Deployment extends Node {
  commit?: Commit | null /* Identifies the commit sha of the deployment. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  creator?: Actor | null /* Identifies the actor who triggered the deployment. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  environment?:
    | string
    | null /* The environment to which this deployment was made. */
  id: string
  latestStatus?: DeploymentStatus | null /* The latest status of this deployment. */
  payload?:
    | string
    | null /* Extra information that a deployment system might need. */
  repository: Repository /* Identifies the repository associated with the deployment. */
  state?: DeploymentState | null /* The current state of the deployment. */
  statuses?: DeploymentStatusConnection | null /* A list of statuses associated with the deployment. */
}

/* Describes the status of a given deployment attempt. */
export interface DeploymentStatus extends Node {
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  creator?: Actor | null /* Identifies the actor who triggered the deployment. */
  deployment: Deployment /* Identifies the deployment associated with status. */
  description?:
    | string
    | null /* Identifies the description of the deployment. */
  environmentUrl?: URI | null /* Identifies the environment URL of the deployment. */
  id: string
  logUrl?: URI | null /* Identifies the log URL of the deployment. */
  state: DeploymentStatusState /* Identifies the current state of the deployment. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
}

/* The connection type for DeploymentStatus. */
export interface DeploymentStatusConnection {
  edges?: DeploymentStatusEdge[] | null /* A list of edges. */
  nodes?: DeploymentStatus[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface DeploymentStatusEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: DeploymentStatus | null /* The item at the end of the edge. */
}

/* Represents a &#x27;head_ref_deleted&#x27; event on a given pull request. */
export interface HeadRefDeletedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  headRef?: Ref | null /* Identifies the Ref associated with the &#x60;head_ref_deleted&#x60; event. */
  headRefName: string /* Identifies the name of the Ref associated with the &#x60;head_ref_deleted&#x60; event. */
  id: string
  pullRequest: PullRequest /* PullRequest referenced by event. */
}

/* Represents a &#x27;head_ref_restored&#x27; event on a given pull request. */
export interface HeadRefRestoredEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  pullRequest: PullRequest /* PullRequest referenced by event. */
}

/* Represents a &#x27;head_ref_force_pushed&#x27; event on a given pull request. */
export interface HeadRefForcePushedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  afterCommit?: Commit | null /* Identifies the after commit SHA for the &#x27;head_ref_force_pushed&#x27; event. */
  beforeCommit?: Commit | null /* Identifies the before commit SHA for the &#x27;head_ref_force_pushed&#x27; event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  pullRequest: PullRequest /* PullRequest referenced by event. */
  ref?: Ref | null /* Identifies the fully qualified ref name for the &#x27;head_ref_force_pushed&#x27; event. */
}

/* Represents a &#x27;base_ref_force_pushed&#x27; event on a given pull request. */
export interface BaseRefForcePushedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  afterCommit?: Commit | null /* Identifies the after commit SHA for the &#x27;base_ref_force_pushed&#x27; event. */
  beforeCommit?: Commit | null /* Identifies the before commit SHA for the &#x27;base_ref_force_pushed&#x27; event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  pullRequest: PullRequest /* PullRequest referenced by event. */
  ref?: Ref | null /* Identifies the fully qualified ref name for the &#x27;base_ref_force_pushed&#x27; event. */
}

/* Represents an &#x27;review_requested&#x27; event on a given pull request. */
export interface ReviewRequestedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  pullRequest: PullRequest /* PullRequest referenced by event. */
  requestedReviewer?: RequestedReviewer | null /* Identifies the reviewer whose review was requested. */
  subject?: User | null /* Identifies the user whose review was requested. */
}

/* Represents an &#x27;review_request_removed&#x27; event on a given pull request. */
export interface ReviewRequestRemovedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  pullRequest: PullRequest /* PullRequest referenced by event. */
  requestedReviewer?: RequestedReviewer | null /* Identifies the reviewer whose review request was removed. */
  subject?: User | null /* Identifies the user whose review request was removed. */
}

/* Represents a &#x27;review_dismissed&#x27; event on a given issue or pull request. */
export interface ReviewDismissedEvent extends Node, UniformResourceLocatable {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
  message: string /* Identifies the message associated with the &#x27;review_dismissed&#x27; event. */
  messageHtml: HTML /* The message associated with the event, rendered to HTML. */
  previousReviewState: PullRequestReviewState /* Identifies the previous state of the review with the &#x27;review_dismissed&#x27; event. */
  pullRequest: PullRequest /* PullRequest referenced by event. */
  pullRequestCommit?: PullRequestCommit | null /* Identifies the commit which caused the review to become stale. */
  resourcePath: URI /* The HTTP path for this review dismissed event. */
  review?: PullRequestReview | null /* Identifies the review associated with the &#x27;review_dismissed&#x27; event. */
  url: URI /* The HTTP URL for this review dismissed event. */
}

/* The connection type for DeployKey. */
export interface DeployKeyConnection {
  edges?: DeployKeyEdge[] | null /* A list of edges. */
  nodes?: DeployKey[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface DeployKeyEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: DeployKey | null /* The item at the end of the edge. */
}

/* A repository deploy key. */
export interface DeployKey extends Node {
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  id: string
  key: string /* The deploy key. */
  readOnly: boolean /* Whether or not the deploy key is read only. */
  title: string /* The deploy key title. */
  verified: boolean /* Whether or not the deploy key has been verified. */
}

/* The connection type for Deployment. */
export interface DeploymentConnection {
  edges?: DeploymentEdge[] | null /* A list of edges. */
  nodes?: Deployment[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface DeploymentEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Deployment | null /* The item at the end of the edge. */
}

/* A list of languages associated with the parent. */
export interface LanguageConnection {
  edges?: LanguageEdge[] | null /* A list of edges. */
  nodes?: Language[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
  totalSize: number /* The total size in bytes of files written in that language. */
}

/* Represents the language of a repository. */
export interface LanguageEdge {
  cursor: string
  node: Language
  size: number /* The number of bytes of code written in the language. */
}

/* Represents a given language found in repositories. */
export interface Language extends Node {
  color?: string | null /* The color defined for the current language. */
  id: string
  name: string /* The name of the current language. */
}

/* The connection type for Milestone. */
export interface MilestoneConnection {
  edges?: MilestoneEdge[] | null /* A list of edges. */
  nodes?: Milestone[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface MilestoneEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Milestone | null /* The item at the end of the edge. */
}

/* A list of projects associated with the owner. */
export interface ProjectConnection {
  edges?: ProjectEdge[] | null /* A list of edges. */
  nodes?: Project[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface ProjectEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Project | null /* The item at the end of the edge. */
}

/* The connection type for ProtectedBranch. */
export interface ProtectedBranchConnection {
  edges?: ProtectedBranchEdge[] | null /* A list of edges. */
  nodes?: ProtectedBranch[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface ProtectedBranchEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: ProtectedBranch | null /* The item at the end of the edge. */
}

/* A repository protected branch. */
export interface ProtectedBranch extends Node {
  creator?: Actor | null /* The actor who created this protected branch. */
  hasDismissableStaleReviews: boolean /* Will new commits pushed to this branch dismiss pull request review approvals. */
  hasRequiredReviews: boolean /* Are reviews required to update this branch. */
  hasRequiredStatusChecks: boolean /* Are status checks required to update this branch. */
  hasRestrictedPushes: boolean /* Is pushing to this branch restricted. */
  hasRestrictedReviewDismissals: boolean /* Is dismissal of pull request reviews restricted. */
  hasStrictRequiredStatusChecks: boolean /* Are branches required to be up to date before merging. */
  id: string
  isAdminEnforced: boolean /* Can admins overwrite branch protection. */
  name: string /* Identifies the name of the protected branch. */
  pushAllowances: PushAllowanceConnection /* A list push allowances for this protected branch. */
  repository: Repository /* The repository associated with this protected branch. */
  requiredStatusCheckContexts?:
    | string[]
    | null /* List of required status check contexts that must pass for commits to be accepted to this branch. */
  reviewDismissalAllowances: ReviewDismissalAllowanceConnection /* A list review dismissal allowances for this protected branch. */
}

/* The connection type for PushAllowance. */
export interface PushAllowanceConnection {
  edges?: PushAllowanceEdge[] | null /* A list of edges. */
  nodes?: PushAllowance[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface PushAllowanceEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: PushAllowance | null /* The item at the end of the edge. */
}

/* A team or user who has the ability to push to a protected branch. */
export interface PushAllowance extends Node {
  actor?: PushAllowanceActor | null /* The actor that can push. */
  id: string
  protectedBranch: ProtectedBranch /* Identifies the protected branch associated with the allowed user or team. */
}

/* The connection type for ReviewDismissalAllowance. */
export interface ReviewDismissalAllowanceConnection {
  edges?: ReviewDismissalAllowanceEdge[] | null /* A list of edges. */
  nodes?: ReviewDismissalAllowance[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface ReviewDismissalAllowanceEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: ReviewDismissalAllowance | null /* The item at the end of the edge. */
}

/* A team or user who has the ability to dismiss a review on a protected branch. */
export interface ReviewDismissalAllowance extends Node {
  actor?: ReviewDismissalAllowanceActor | null /* The actor that can dismiss. */
  id: string
  protectedBranch: ProtectedBranch /* Identifies the protected branch associated with the allowed user or team. */
}

/* The connection type for Ref. */
export interface RefConnection {
  edges?: RefEdge[] | null /* A list of edges. */
  nodes?: Ref[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface RefEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Ref | null /* The item at the end of the edge. */
}

/* A release contains the content for a release. */
export interface Release extends Node, UniformResourceLocatable {
  author?: User | null /* The author of the release */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  description?: string | null /* Identifies the description of the release. */
  id: string
  isDraft: boolean /* Whether or not the release is a draft */
  isPrerelease: boolean /* Whether or not the release is a prerelease */
  name?: string | null /* Identifies the title of the release. */
  publishedAt?: DateTime | null /* Identifies the date and time when the release was created. */
  releaseAssets: ReleaseAssetConnection /* List of releases assets which are dependent on this release. */
  resourcePath: URI /* The HTTP path for this issue */
  tag?: Ref | null /* The Git tag the release points to */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this issue */
}

/* The connection type for ReleaseAsset. */
export interface ReleaseAssetConnection {
  edges?: ReleaseAssetEdge[] | null /* A list of edges. */
  nodes?: ReleaseAsset[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface ReleaseAssetEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: ReleaseAsset | null /* The item at the end of the edge. */
}

/* A release asset contains the content for a release asset. */
export interface ReleaseAsset extends Node {
  contentType: string /* The asset&#x27;s content-type */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  downloadCount: number /* The number of times this asset was downloaded */
  downloadUrl: URI /* Identifies the URL where you can download the release asset via the browser. */
  id: string
  name: string /* Identifies the title of the release asset. */
  release?: Release | null /* Release that the asset is associated with */
  size: number /* The size (in bytes) of the asset */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  uploadedBy: User /* The user that performed the upload */
  url: URI /* Identifies the URL of the release asset. */
}

/* The connection type for Release. */
export interface ReleaseConnection {
  edges?: ReleaseEdge[] | null /* A list of edges. */
  nodes?: Release[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface ReleaseEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Release | null /* The item at the end of the edge. */
}

/* The connection type for RepositoryTopic. */
export interface RepositoryTopicConnection {
  edges?: RepositoryTopicEdge[] | null /* A list of edges. */
  nodes?: RepositoryTopic[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface RepositoryTopicEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: RepositoryTopic | null /* The item at the end of the edge. */
}

/* A repository-topic connects a repository to a topic. */
export interface RepositoryTopic extends Node, UniformResourceLocatable {
  id: string
  resourcePath: URI /* The HTTP path for this repository-topic. */
  topic: Topic /* The topic. */
  url: URI /* The HTTP URL for this repository-topic. */
}

/* A topic aggregates entities that are related to a subject. */
export interface Topic extends Node {
  id: string
  name: string /* The topic&#x27;s name. */
  relatedTopics: Topic[] /* A list of related topics, including aliases of this topic, sorted with the most relevantfirst. */
}

/* The connection type for User. */
export interface FollowerConnection {
  edges?: UserEdge[] | null /* A list of edges. */
  nodes?: User[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* The connection type for User. */
export interface FollowingConnection {
  edges?: UserEdge[] | null /* A list of edges. */
  nodes?: User[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* A Gist. */
export interface Gist extends Node, Starrable {
  comments: GistCommentConnection /* A list of comments associated with the gist */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  description?: string | null /* The gist description. */
  id: string
  isPublic: boolean /* Whether the gist is public or not. */
  name: string /* The gist name. */
  owner?: RepositoryOwner | null /* The gist owner. */
  pushedAt?: DateTime | null /* Identifies when the gist was last pushed to. */
  stargazers: StargazerConnection /* A list of users who have starred this starrable. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  viewerHasStarred: boolean /* Returns a boolean indicating whether the viewing user has starred this starrable. */
}

/* The connection type for GistComment. */
export interface GistCommentConnection {
  edges?: GistCommentEdge[] | null /* A list of edges. */
  nodes?: GistComment[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface GistCommentEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: GistComment | null /* The item at the end of the edge. */
}

/* Represents a comment on an Gist. */
export interface GistComment
  extends Node,
    Comment,
    Deletable,
    Updatable,
    UpdatableComment {
  author?: Actor | null /* The actor who authored the comment. */
  authorAssociation: CommentAuthorAssociation /* Author&#x27;s association with the gist. */
  body: string /* Identifies the comment body. */
  bodyHTML: HTML /* The comment body rendered to HTML. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  createdViaEmail: boolean /* Check if this comment was created via an email reply. */
  editor?: Actor | null /* The actor who edited the comment. */
  gist: Gist /* The associated gist. */
  id: string
  lastEditedAt?: DateTime | null /* The moment the editor made the last edit */
  publishedAt?: DateTime | null /* Identifies when the comment was published at. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  viewerCanDelete: boolean /* Check if the current viewer can delete this object. */
  viewerCanUpdate: boolean /* Check if the current viewer can update this object. */
  viewerCannotUpdateReasons: CommentCannotUpdateReason[] /* Reasons why the current viewer can not update this comment. */
  viewerDidAuthor: boolean /* Did the viewer author this comment. */
}

/* The connection type for Gist. */
export interface GistConnection {
  edges?: GistEdge[] | null /* A list of edges. */
  nodes?: Gist[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface GistEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Gist | null /* The item at the end of the edge. */
}

/* The connection type for Organization. */
export interface OrganizationConnection {
  edges?: OrganizationEdge[] | null /* A list of edges. */
  nodes?: Organization[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface OrganizationEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Organization | null /* The item at the end of the edge. */
}

/* The connection type for PublicKey. */
export interface PublicKeyConnection {
  edges?: PublicKeyEdge[] | null /* A list of edges. */
  nodes?: PublicKey[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface PublicKeyEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: PublicKey | null /* The item at the end of the edge. */
}

/* A user&#x27;s public key. */
export interface PublicKey extends Node {
  id: string
  key: string /* The public key string */
}

/* The connection type for Repository. */
export interface StarredRepositoryConnection {
  edges?: StarredRepositoryEdge[] | null /* A list of edges. */
  nodes?: Repository[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* Represents a starred repository. */
export interface StarredRepositoryEdge {
  cursor: string
  node: Repository
  starredAt: DateTime /* Identifies when the item was starred. */
}

/* The connection type for IssueTimelineItem. */
export interface IssueTimelineConnection {
  edges?: IssueTimelineItemEdge[] | null /* A list of edges. */
  nodes?: IssueTimelineItem[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface IssueTimelineItemEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: IssueTimelineItem | null /* The item at the end of the edge. */
}

/* An Identity Provider configured to provision SAML and SCIM identities for Organizations */
export interface OrganizationIdentityProvider extends Node {
  digestMethod?: URI | null /* The digest algorithm used to sign SAML requests for the Identity Provider. */
  externalIdentities: ExternalIdentityConnection /* External Identities provisioned by this Identity Provider */
  id: string
  idpCertificate?: X509Certificate | null /* The x509 certificate used by the Identity Provder to sign assertions and responses. */
  issuer?:
    | string
    | null /* The Issuer Entity ID for the SAML Identity Provider */
  organization?: Organization | null /* Organization this Identity Provider belongs to */
  signatureMethod?: URI | null /* The signature algorithm used to sign SAML requests for the Identity Provider. */
  ssoUrl?: URI | null /* The URL endpoint for the Identity Provider&#x27;s SAML SSO. */
}

/* The connection type for ExternalIdentity. */
export interface ExternalIdentityConnection {
  edges?: ExternalIdentityEdge[] | null /* A list of edges. */
  nodes?: ExternalIdentity[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface ExternalIdentityEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: ExternalIdentity | null /* The item at the end of the edge. */
}

/* An external identity provisioned by SAML SSO or SCIM. */
export interface ExternalIdentity extends Node {
  guid: string /* The GUID for this identity */
  id: string
  organizationInvitation?: OrganizationInvitation | null /* Organization invitation for this SCIM-provisioned external identity */
  samlIdentity?: ExternalIdentitySamlAttributes | null /* SAML Identity attributes */
  scimIdentity?: ExternalIdentityScimAttributes | null /* SCIM Identity attributes */
  user?: User | null /* User linked to this external identity */
}

/* SAML attributes for the External Identity */
export interface ExternalIdentitySamlAttributes {
  nameId?: string | null /* The NameID of the SAML identity */
}

/* SCIM attributes for the External Identity */
export interface ExternalIdentityScimAttributes {
  username?: string | null /* The userName of the SCIM identity */
}

/* Represents the client&#x27;s rate limit. */
export interface RateLimit {
  cost: number /* The point cost for the current query counting against the rate limit. */
  limit: number /* The maximum number of points the client is permitted to consume in a 60 minute window. */
  nodeCount: number /* The maximum number of nodes this query may return */
  remaining: number /* The number of points remaining in the current rate limit window. */
  resetAt: DateTime /* The time at which the current rate limit window resets in UTC epoch seconds. */
}

/* A list of results that matched against a search query. */
export interface SearchResultItemConnection {
  codeCount: number /* The number of pieces of code that matched the search query. */
  edges?: SearchResultItemEdge[] | null /* A list of edges. */
  issueCount: number /* The number of issues that matched the search query. */
  nodes?: SearchResultItem[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  repositoryCount: number /* The number of repositories that matched the search query. */
  userCount: number /* The number of users that matched the search query. */
  wikiCount: number /* The number of wiki pages that matched the search query. */
}

/* An edge in a connection. */
export interface SearchResultItemEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: SearchResultItem | null /* The item at the end of the edge. */
}

/* The root query for implementing GraphQL mutations. */
export interface Mutation {
  acceptTopicSuggestion?: AcceptTopicSuggestionPayload | null /* Applies a suggested topic to the repository. */
  addComment?: AddCommentPayload | null /* Adds a comment to an Issue or Pull Request. */
  addProjectCard?: AddProjectCardPayload | null /* Adds a card to a ProjectColumn. Either &#x60;contentId&#x60; or &#x60;note&#x60; must be provided but **not** both. */
  addProjectColumn?: AddProjectColumnPayload | null /* Adds a column to a Project. */
  addPullRequestReview?: AddPullRequestReviewPayload | null /* Adds a review to a Pull Request. */
  addPullRequestReviewComment?: AddPullRequestReviewCommentPayload | null /* Adds a comment to a review. */
  addReaction?: AddReactionPayload | null /* Adds a reaction to a subject. */
  addStar?: AddStarPayload | null /* Adds a star to a Starrable. */
  createProject?: CreateProjectPayload | null /* Creates a new project. */
  declineTopicSuggestion?: DeclineTopicSuggestionPayload | null /* Rejects a suggested topic for the repository. */
  deleteProject?: DeleteProjectPayload | null /* Deletes a project. */
  deleteProjectCard?: DeleteProjectCardPayload | null /* Deletes a project card. */
  deleteProjectColumn?: DeleteProjectColumnPayload | null /* Deletes a project column. */
  deletePullRequestReview?: DeletePullRequestReviewPayload | null /* Deletes a pull request review. */
  dismissPullRequestReview?: DismissPullRequestReviewPayload | null /* Dismisses an approved or rejected pull request review. */
  moveProjectCard?: MoveProjectCardPayload | null /* Moves a project card to another place. */
  moveProjectColumn?: MoveProjectColumnPayload | null /* Moves a project column to another place. */
  removeOutsideCollaborator?: RemoveOutsideCollaboratorPayload | null /* Removes outside collaborator from all repositories in an organization. */
  removeReaction?: RemoveReactionPayload | null /* Removes a reaction from a subject. */
  removeStar?: RemoveStarPayload | null /* Removes a star from a Starrable. */
  requestReviews?: RequestReviewsPayload | null /* Set review requests on a pull request. */
  submitPullRequestReview?: SubmitPullRequestReviewPayload | null /* Submits a pending pull request review. */
  updateProject?: UpdateProjectPayload | null /* Updates an existing project. */
  updateProjectCard?: UpdateProjectCardPayload | null /* Updates an existing project card. */
  updateProjectColumn?: UpdateProjectColumnPayload | null /* Updates an existing project column. */
  updatePullRequestReview?: UpdatePullRequestReviewPayload | null /* Updates the body of a pull request review. */
  updatePullRequestReviewComment?: UpdatePullRequestReviewCommentPayload | null /* Updates a pull request review comment. */
  updateSubscription?: UpdateSubscriptionPayload | null /* Updates viewers repository subscription state. */
  updateTopics?: UpdateTopicsPayload | null /* Replaces the repository&#x27;s topics with the given topics. */
}

/* Autogenerated return type of AcceptTopicSuggestion */
export interface AcceptTopicSuggestionPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  topic: Topic /* The accepted topic. */
}

/* Autogenerated return type of AddComment */
export interface AddCommentPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  commentEdge: IssueCommentEdge /* The edge from the subject&#x27;s comment connection. */
  subject: Node /* The subject */
  timelineEdge: IssueTimelineItemEdge /* The edge from the subject&#x27;s timeline connection. */
}

/* Autogenerated return type of AddProjectCard */
export interface AddProjectCardPayload {
  cardEdge: ProjectCardEdge /* The edge from the ProjectColumn&#x27;s card connection. */
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  projectColumn: Project /* The ProjectColumn */
}

/* Autogenerated return type of AddProjectColumn */
export interface AddProjectColumnPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  columnEdge: ProjectColumnEdge /* The edge from the project&#x27;s column connection. */
  project: Project /* The project */
}

/* Autogenerated return type of AddPullRequestReview */
export interface AddPullRequestReviewPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReview: PullRequestReview /* The newly created pull request review. */
  reviewEdge: PullRequestReviewEdge /* The edge from the pull request&#x27;s review connection. */
}

/* Autogenerated return type of AddPullRequestReviewComment */
export interface AddPullRequestReviewCommentPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  comment: PullRequestReviewComment /* The newly created comment. */
  commentEdge: PullRequestReviewCommentEdge /* The edge from the review&#x27;s comment connection. */
}

/* Autogenerated return type of AddReaction */
export interface AddReactionPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  reaction: Reaction /* The reaction object. */
  subject: Reactable /* The reactable subject. */
}

/* Autogenerated return type of AddStar */
export interface AddStarPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  starrable: Starrable /* The starrable. */
}

/* Autogenerated return type of CreateProject */
export interface CreateProjectPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  project: Project /* The new project. */
}

/* Autogenerated return type of DeclineTopicSuggestion */
export interface DeclineTopicSuggestionPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  topic: Topic /* The declined topic. */
}

/* Autogenerated return type of DeleteProject */
export interface DeleteProjectPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  owner: ProjectOwner /* The repository or organization the project was removed from. */
}

/* Autogenerated return type of DeleteProjectCard */
export interface DeleteProjectCardPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  column: ProjectColumn /* The column the deleted card was in. */
  deletedCardId: string /* The deleted card ID. */
}

/* Autogenerated return type of DeleteProjectColumn */
export interface DeleteProjectColumnPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  deletedColumnId: string /* The deleted column ID. */
  project: Project /* The project the deleted column was in. */
}

/* Autogenerated return type of DeletePullRequestReview */
export interface DeletePullRequestReviewPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReview: PullRequestReview /* The deleted pull request review. */
}

/* Autogenerated return type of DismissPullRequestReview */
export interface DismissPullRequestReviewPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReview: PullRequestReview /* The dismissed pull request review. */
}

/* Autogenerated return type of MoveProjectCard */
export interface MoveProjectCardPayload {
  cardEdge: ProjectCardEdge /* The new edge of the moved card. */
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
}

/* Autogenerated return type of MoveProjectColumn */
export interface MoveProjectColumnPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  columnEdge: ProjectColumnEdge /* The new edge of the moved column. */
}

/* Autogenerated return type of RemoveOutsideCollaborator */
export interface RemoveOutsideCollaboratorPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  removedUser: User /* The user that was removed as an outside collaborator. */
}

/* Autogenerated return type of RemoveReaction */
export interface RemoveReactionPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  reaction: Reaction /* The reaction object. */
  subject: Reactable /* The reactable subject. */
}

/* Autogenerated return type of RemoveStar */
export interface RemoveStarPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  starrable: Starrable /* The starrable. */
}

/* Autogenerated return type of RequestReviews */
export interface RequestReviewsPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequest: PullRequest /* The pull request that is getting requests. */
  requestedReviewersEdge: UserEdge /* The edge from the pull request to the requested reviewers. */
}

/* Autogenerated return type of SubmitPullRequestReview */
export interface SubmitPullRequestReviewPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReview: PullRequestReview /* The submitted pull request review. */
}

/* Autogenerated return type of UpdateProject */
export interface UpdateProjectPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  project: Project /* The updated project. */
}

/* Autogenerated return type of UpdateProjectCard */
export interface UpdateProjectCardPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  projectCard: ProjectCard /* The updated ProjectCard. */
}

/* Autogenerated return type of UpdateProjectColumn */
export interface UpdateProjectColumnPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  projectColumn: ProjectColumn /* The updated project column. */
}

/* Autogenerated return type of UpdatePullRequestReview */
export interface UpdatePullRequestReviewPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReview: PullRequestReview /* The updated pull request review. */
}

/* Autogenerated return type of UpdatePullRequestReviewComment */
export interface UpdatePullRequestReviewCommentPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReviewComment: PullRequestReviewComment /* The updated comment. */
}

/* Autogenerated return type of UpdateSubscription */
export interface UpdateSubscriptionPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  subscribable: Subscribable /* The input subscribable entity. */
}

/* Autogenerated return type of UpdateTopics */
export interface UpdateTopicsPayload {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  invalidTopicNames: string[] /* Names of the provided topics that are not valid. */
  repository: Repository /* The updated repository. */
}

/* An edge in a connection. */
export interface UserContentEditEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: UserContentEdit | null /* The item at the end of the edge. */
}

/* An edit on user content */
export interface UserContentEdit {
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  editor?: Actor | null /* The actor who edited this content, */
  id: string
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
}

/* Represents a Git blob. */
export interface Blob extends Node, GitObject {
  abbreviatedOid: string /* An abbreviated version of the Git object ID */
  byteSize: number /* Byte size of Blob object */
  commitResourcePath: URI /* The HTTP path for this Git object */
  commitUrl: URI /* The HTTP URL for this Git object */
  id: string
  isBinary: boolean /* Indicates whether the Blob is binary or text */
  isTruncated: boolean /* Indicates whether the contents is truncated */
  oid: GitObjectID /* The Git object ID */
  repository: Repository /* The Repository the Git object belongs to */
  text?: string | null /* UTF8 text data or null if the Blob is binary */
}

/* A special type of user which takes actions on behalf of GitHub Apps. */
export interface Bot extends Node, Actor, UniformResourceLocatable {
  avatarUrl: URI /* A URL pointing to the GitHub App&#x27;s public avatar. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
  login: string /* The username of the actor. */
  resourcePath: URI /* The HTTP path for this bot */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this bot */
}

/* Represents a &#x27;base_ref_changed&#x27; event on a given issue or pull request. */
export interface BaseRefChangedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
}

/* Represents a &#x27;added_to_project&#x27; event on a given issue or pull request. */
export interface AddedToProjectEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
}

/* Represents a &#x27;comment_deleted&#x27; event on a given issue or pull request. */
export interface CommentDeletedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
}

/* Represents a &#x27;converted_note_to_issue&#x27; event on a given issue or pull request. */
export interface ConvertedNoteToIssueEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
}

/* Represents a &#x27;mentioned&#x27; event on a given issue or pull request. */
export interface MentionedEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
}

/* Represents a &#x27;moved_columns_in_project&#x27; event on a given issue or pull request. */
export interface MovedColumnsInProjectEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
}

/* Represents a &#x27;removed_from_project&#x27; event on a given issue or pull request. */
export interface RemovedFromProjectEvent extends Node {
  actor?: Actor | null /* Identifies the actor who performed the event. */
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  databaseId?: number | null /* Identifies the primary key from the database. */
  id: string
}

/* The connection type for Topic. */
export interface TopicConnection {
  edges?: TopicEdge[] | null /* A list of edges. */
  nodes?: Topic[] | null /* A list of nodes. */
  pageInfo: PageInfo /* Information to aid in pagination. */
  totalCount: number /* Identifies the total count of items in the connection. */
}

/* An edge in a connection. */
export interface TopicEdge {
  cursor: string /* A cursor for use in pagination. */
  node?: Topic | null /* The item at the end of the edge. */
}

/* Represents a GPG signature on a Commit or Tag. */
export interface GpgSignature extends GitSignature {
  email: string /* Email used to sign this object. */
  isValid: boolean /* True if the signature is valid and verified by GitHub. */
  keyId?: string | null /* Hex-encoded ID of the key that signed this object. */
  payload: string /* Payload for GPG signing object. Raw ODB object without the signature header. */
  signature: string /* ASCII-armored signature header from object. */
  signer?: User | null /* GitHub user corresponding to the email signing this commit. */
  state: GitSignatureState /* The state of this signature. &#x60;VALID&#x60; if signature is valid and verified by GitHub, otherwise represents reason why signature is considered invalid. */
}

/* An invitation for a user to be added to a repository. */
export interface RepositoryInvitation extends Node {
  id: string
  invitee: User /* The user who received the invitation. */
  inviter: User /* The user who created the invitation. */
  repository?: RepositoryInvitationRepository | null /* The Repository the user is invited to. */
}

/* A subset of repository info shared with potential collaborators. */
export interface RepositoryInvitationRepository extends RepositoryInfo {
  createdAt: DateTime /* Identifies the date and time when the object was created. */
  description?: string | null /* The description of the repository. */
  descriptionHTML: HTML /* The description of the repository rendered to HTML. */
  forkCount: number /* Returns how many forks there are of this repository in the whole network. */
  hasIssuesEnabled: boolean /* Indicates if the repository has issues feature enabled. */
  hasWikiEnabled: boolean /* Indicates if the repository has wiki feature enabled. */
  homepageUrl?: URI | null /* The repository&#x27;s URL. */
  isArchived: boolean /* Indicates if the repository is unmaintained. */
  isFork: boolean /* Identifies if the repository is a fork. */
  isLocked: boolean /* Indicates if the repository has been locked or not. */
  isMirror: boolean /* Identifies if the repository is a mirror. */
  isPrivate: boolean /* Identifies if the repository is private. */
  license?: string | null /* The license associated with the repository */
  licenseInfo?: License | null /* The license associated with the repository */
  lockReason?: RepositoryLockReason | null /* The reason the repository has been locked. */
  mirrorUrl?: URI | null /* The repository&#x27;s original mirror URL. */
  name: string /* The name of the repository. */
  nameWithOwner: string /* The repository&#x27;s name with owner. */
  owner: RepositoryOwner /* The owner of the repository associated with this invitation repository. */
  pushedAt?: DateTime | null /* Identifies when the repository was last pushed to. */
  resourcePath: URI /* The HTTP path for this repository */
  shortDescriptionHTML: HTML /* A description of the repository, rendered to HTML without any links in it. */
  updatedAt: DateTime /* Identifies the date and time when the object was last updated. */
  url: URI /* The HTTP URL for this repository */
}

/* Represents an S/MIME signature on a Commit or Tag. */
export interface SmimeSignature extends GitSignature {
  email: string /* Email used to sign this object. */
  isValid: boolean /* True if the signature is valid and verified by GitHub. */
  payload: string /* Payload for GPG signing object. Raw ODB object without the signature header. */
  signature: string /* ASCII-armored signature header from object. */
  signer?: User | null /* GitHub user corresponding to the email signing this commit. */
  state: GitSignatureState /* The state of this signature. &#x60;VALID&#x60; if signature is valid and verified by GitHub, otherwise represents reason why signature is considered invalid. */
}

/* Represents a Git tag. */
export interface Tag extends Node, GitObject {
  abbreviatedOid: string /* An abbreviated version of the Git object ID */
  commitResourcePath: URI /* The HTTP path for this Git object */
  commitUrl: URI /* The HTTP URL for this Git object */
  id: string
  message?: string | null /* The Git tag message. */
  name: string /* The Git tag name. */
  oid: GitObjectID /* The Git object ID */
  repository: Repository /* The Repository the Git object belongs to */
  tagger?: GitActor | null /* Details about the tag author. */
  target: GitObject /* The Git object the tag points to. */
}

/* Represents an unknown signature on a Commit or Tag. */
export interface UnknownSignature extends GitSignature {
  email: string /* Email used to sign this object. */
  isValid: boolean /* True if the signature is valid and verified by GitHub. */
  payload: string /* Payload for GPG signing object. Raw ODB object without the signature header. */
  signature: string /* ASCII-armored signature header from object. */
  signer?: User | null /* GitHub user corresponding to the email signing this commit. */
  state: GitSignatureState /* The state of this signature. &#x60;VALID&#x60; if signature is valid and verified by GitHub, otherwise represents reason why signature is considered invalid. */
}

/* Ordering options for repository connections */
export interface RepositoryOrder {
  field: RepositoryOrderField /* The field to order repositories by. */
  direction: OrderDirection /* The ordering direction. */
}

/* Ways in which star connections can be ordered. */
export interface StarOrder {
  field: StarOrderField /* The field in which to order nodes by. */
  direction: OrderDirection /* The direction in which to order nodes. */
}

/* Ways in which lists of reactions can be ordered upon return. */
export interface ReactionOrder {
  field: ReactionOrderField /* The field in which to order reactions by. */
  direction: OrderDirection /* The direction in which to order reactions by the specified field. */
}

/* Specifies an author for filtering Git commits. */
export interface CommitAuthor {
  id?:
    | string
    | null /* ID of a User to filter by. If non-null, only commits authored by this user will be returned. This field takes precedence over emails. */
  emails: string[] /* Email addresses to filter by. Commits authored by any of the specified email addresses will be returned. */
}

/* Ways in which lists of issues can be ordered upon return. */
export interface IssueOrder {
  field: IssueOrderField /* The field in which to order issues by. */
  direction: OrderDirection /* The direction in which to order issues by the specified field. */
}

/* Ways in which team connections can be ordered. */
export interface TeamOrder {
  field: TeamOrderField /* The field in which to order nodes by. */
  direction: OrderDirection /* The direction in which to order nodes. */
}

/* Ordering options for team repository connections */
export interface TeamRepositoryOrder {
  field: TeamRepositoryOrderField /* The field to order repositories by. */
  direction: OrderDirection /* The ordering direction. */
}

/* Ordering options for language connections. */
export interface LanguageOrder {
  field: LanguageOrderField /* The field to order languages by. */
  direction: OrderDirection /* The ordering direction. */
}

/* Ways in which lists of projects can be ordered upon return. */
export interface ProjectOrder {
  field: ProjectOrderField /* The field in which to order projects by. */
  direction: OrderDirection /* The direction in which to order projects by the specified field. */
}

/* Ways in which lists of git refs can be ordered upon return. */
export interface RefOrder {
  field: RefOrderField /* The field in which to order refs by. */
  direction: OrderDirection /* The direction in which to order refs by the specified field. */
}

/* Ways in which lists of releases can be ordered upon return. */
export interface ReleaseOrder {
  field: ReleaseOrderField /* The field in which to order releases by. */
  direction: OrderDirection /* The direction in which to order releases by the specified field. */
}

/* Ordering options for gist connections */
export interface GistOrder {
  field: GistOrderField /* The field to order repositories by. */
  direction: OrderDirection /* The ordering direction. */
}

/* Autogenerated input type of AcceptTopicSuggestion */
export interface AcceptTopicSuggestionInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  repositoryId: string /* The Node ID of the repository. */
  name: string /* The name of the suggested topic. */
}

/* Autogenerated input type of AddComment */
export interface AddCommentInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  subjectId: string /* The Node ID of the subject to modify. */
  body: string /* The contents of the comment. */
}

/* Autogenerated input type of AddProjectCard */
export interface AddProjectCardInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  projectColumnId: string /* The Node ID of the ProjectColumn. */
  contentId?:
    | string
    | null /* The content of the card. Must be a member of the ProjectCardItem union */
  note?: string | null /* The note on the card. */
}

/* Autogenerated input type of AddProjectColumn */
export interface AddProjectColumnInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  projectId: string /* The Node ID of the project. */
  name: string /* The name of the column. */
}

/* Autogenerated input type of AddPullRequestReview */
export interface AddPullRequestReviewInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestId: string /* The Node ID of the pull request to modify. */
  commitOID?: GitObjectID | null /* The commit OID the review pertains to. */
  body?: string | null /* The contents of the review body comment. */
  event?: PullRequestReviewEvent | null /* The event to perform on the pull request review. */
  comments?:
    | DraftPullRequestReviewComment[]
    | null /* The review line comments. */
}

/* Specifies a review comment to be left with a Pull Request Review. */
export interface DraftPullRequestReviewComment {
  path: string /* Path to the file being commented on. */
  position: number /* Position in the file to leave a comment on. */
  body: string /* Body of the comment to leave. */
}

/* Autogenerated input type of AddPullRequestReviewComment */
export interface AddPullRequestReviewCommentInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReviewId: string /* The Node ID of the review to modify. */
  commitOID?: GitObjectID | null /* The SHA of the commit to comment on. */
  body: string /* The text of the comment. */
  path?: string | null /* The relative path of the file to comment on. */
  position?: number | null /* The line index in the diff to comment on. */
  inReplyTo?: string | null /* The comment id to reply to. */
}

/* Autogenerated input type of AddReaction */
export interface AddReactionInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  subjectId: string /* The Node ID of the subject to modify. */
  content: ReactionContent /* The name of the emoji to react with. */
}

/* Autogenerated input type of AddStar */
export interface AddStarInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  starrableId: string /* The Starrable ID to star. */
}

/* Autogenerated input type of CreateProject */
export interface CreateProjectInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  ownerId: string /* The owner ID to create the project under. */
  name: string /* The name of project. */
  body?: string | null /* The description of project. */
}

/* Autogenerated input type of DeclineTopicSuggestion */
export interface DeclineTopicSuggestionInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  repositoryId: string /* The Node ID of the repository. */
  name: string /* The name of the suggested topic. */
  reason: TopicSuggestionDeclineReason /* The reason why the suggested topic is declined. */
}

/* Autogenerated input type of DeleteProject */
export interface DeleteProjectInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  projectId: string /* The Project ID to update. */
}

/* Autogenerated input type of DeleteProjectCard */
export interface DeleteProjectCardInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  cardId: string /* The id of the card to delete. */
}

/* Autogenerated input type of DeleteProjectColumn */
export interface DeleteProjectColumnInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  columnId: string /* The id of the column to delete. */
}

/* Autogenerated input type of DeletePullRequestReview */
export interface DeletePullRequestReviewInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReviewId: string /* The Node ID of the pull request review to delete. */
}

/* Autogenerated input type of DismissPullRequestReview */
export interface DismissPullRequestReviewInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReviewId: string /* The Node ID of the pull request review to modify. */
  message: string /* The contents of the pull request review dismissal message. */
}

/* Autogenerated input type of MoveProjectCard */
export interface MoveProjectCardInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  cardId: string /* The id of the card to move. */
  columnId: string /* The id of the column to move it into. */
  afterCardId?:
    | string
    | null /* Place the new card after the card with this id. Pass null to place it at the top. */
}

/* Autogenerated input type of MoveProjectColumn */
export interface MoveProjectColumnInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  columnId: string /* The id of the column to move. */
  afterColumnId?:
    | string
    | null /* Place the new column after the column with this id. Pass null to place it at the front. */
}

/* Autogenerated input type of RemoveOutsideCollaborator */
export interface RemoveOutsideCollaboratorInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  userId: string /* The ID of the outside collaborator to remove. */
  organizationId: string /* The ID of the organization to remove the outside collaborator from. */
}

/* Autogenerated input type of RemoveReaction */
export interface RemoveReactionInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  subjectId: string /* The Node ID of the subject to modify. */
  content: ReactionContent /* The name of the emoji to react with. */
}

/* Autogenerated input type of RemoveStar */
export interface RemoveStarInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  starrableId: string /* The Starrable ID to unstar. */
}

/* Autogenerated input type of RequestReviews */
export interface RequestReviewsInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestId: string /* The Node ID of the pull request to modify. */
  userIds: string[] /* The Node IDs of the user to request. */
  teamIds: string[] /* The Node IDs of the team to request. */
  union?: boolean | null /* Add users to the set rather than replace. */
}

/* Autogenerated input type of SubmitPullRequestReview */
export interface SubmitPullRequestReviewInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReviewId: string /* The Pull Request Review ID to submit. */
  event: PullRequestReviewEvent /* The event to send to the Pull Request Review. */
  body?: string | null /* The text field to set on the Pull Request Review. */
}

/* Autogenerated input type of UpdateProject */
export interface UpdateProjectInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  projectId: string /* The Project ID to update. */
  name?: string | null /* The name of project. */
  body?: string | null /* The description of project. */
  state?: ProjectState | null /* Whether the project is open or closed. */
  public?: boolean | null /* Whether the project is public or not. */
}

/* Autogenerated input type of UpdateProjectCard */
export interface UpdateProjectCardInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  projectCardId: string /* The ProjectCard ID to update. */
  note: string /* The note of ProjectCard. */
}

/* Autogenerated input type of UpdateProjectColumn */
export interface UpdateProjectColumnInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  projectColumnId: string /* The ProjectColumn ID to update. */
  name: string /* The name of project column. */
}

/* Autogenerated input type of UpdatePullRequestReview */
export interface UpdatePullRequestReviewInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReviewId: string /* The Node ID of the pull request review to modify. */
  body: string /* The contents of the pull request review body. */
}

/* Autogenerated input type of UpdatePullRequestReviewComment */
export interface UpdatePullRequestReviewCommentInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  pullRequestReviewCommentId: string /* The Node ID of the comment to modify. */
  body: string /* The text of the comment. */
}

/* Autogenerated input type of UpdateSubscription */
export interface UpdateSubscriptionInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  subscribableId: string /* The Node ID of the subscribable object to modify. */
  state: SubscriptionState /* The new state of the subscription. */
}

/* Autogenerated input type of UpdateTopics */
export interface UpdateTopicsInput {
  clientMutationId?:
    | string
    | null /* A unique identifier for the client performing the mutation. */
  repositoryId: string /* The Node ID of the repository. */
  topicNames: string[] /* An array of topic names. */
}

export interface CodeOfConductQueryArgs {
  key: string /* The code of conduct&#x27;s key */
}

export interface LicenseQueryArgs {
  key: string /* The license&#x27;s downcased SPDX ID */
}

export interface MarketplaceCategoriesQueryArgs {
  excludeEmpty?: boolean | null /* Exclude categories with no listings. */
}

export interface MarketplaceCategoryQueryArgs {
  slug: string /* The URL slug of the category. */
}

export interface MarketplaceListingQueryArgs {
  slug: string /* Select the listing that matches this slug. It&#x27;s the short name of the listing used in its URL. */
}

export interface MarketplaceListingsQueryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  categorySlug?:
    | string
    | null /* Select only listings with the given category. */
  viewerCanAdmin?:
    | boolean
    | null /* Select listings to which user has admin access. If omitted, listings visible to theviewer are returned. */
  adminId?:
    | string
    | null /* Select listings that can be administered by the specified user. */
  organizationId?:
    | string
    | null /* Select listings for products owned by the specified organization. */
  allStates?:
    | boolean
    | null /* Select listings visible to the viewer even if they are not approved. If omitted orfalse, only approved listings will be returned. */
  slugs?:
    | string[]
    | null /* Select the listings with these slugs, if they are visible to the viewer. */
  primaryCategoryOnly?:
    | boolean
    | null /* Select only listings where the primary category matches the given category slug. */
  withFreeTrialsOnly?:
    | boolean
    | null /* Select only listings that offer a free trial. */
}

export interface NodeQueryArgs {
  id: string /* ID of the object. */
}

export interface NodesQueryArgs {
  ids: string[] /* The list of node IDs. */
}

export interface OrganizationQueryArgs {
  login: string /* The organization&#x27;s login. */
}

export interface RateLimitQueryArgs {
  dryRun?:
    | boolean
    | null /* If true, calculate the cost for the query without evaluating it */
}

export interface RepositoryQueryArgs {
  owner: string /* The login field of a user or organization */
  name: string /* The name of the repository */
}

export interface RepositoryOwnerQueryArgs {
  login: string /* The username to lookup the owner by. */
}

export interface ResourceQueryArgs {
  url: URI /* The URL. */
}

export interface SearchQueryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  query: string /* The search string to look for. */
  type: SearchType /* The types of search items to search within. */
}

export interface TopicQueryArgs {
  name: string /* The topic&#x27;s name. */
}

export interface UserQueryArgs {
  login: string /* The user&#x27;s login. */
}

export interface LogoUrlMarketplaceListingArgs {
  size?: number | null /* The size in pixels of the resulting square image. */
}

export interface AvatarUrlOrganizationArgs {
  size?: number | null /* The size of the resulting square image. */
}

export interface MembersOrganizationArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface PinnedRepositoriesOrganizationArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  privacy?: RepositoryPrivacy | null /* If non-null, filters repositories according to privacy */
  orderBy?: RepositoryOrder | null /* Ordering options for repositories returned from the connection */
  affiliations?:
    | RepositoryAffiliation[]
    | null /* Affiliation options for repositories returned from the connection */
  isLocked?:
    | boolean
    | null /* If non-null, filters repositories according to whether they have been locked */
}

export interface ProjectOrganizationArgs {
  number: number /* The project number to find. */
}

export interface ProjectsOrganizationArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  orderBy?: ProjectOrder | null /* Ordering options for projects returned from the connection */
  search?:
    | string
    | null /* Query to search projects by, currently only searching by name. */
  states: ProjectState[] /* A list of states to filter the projects by. */
}

export interface RepositoriesOrganizationArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  privacy?: RepositoryPrivacy | null /* If non-null, filters repositories according to privacy */
  orderBy?: RepositoryOrder | null /* Ordering options for repositories returned from the connection */
  affiliations?:
    | RepositoryAffiliation[]
    | null /* Affiliation options for repositories returned from the connection */
  isLocked?:
    | boolean
    | null /* If non-null, filters repositories according to whether they have been locked */
  isFork?:
    | boolean
    | null /* If non-null, filters repositories according to whether they are forks of another repository */
}

export interface RepositoryOrganizationArgs {
  name: string /* Name of Repository to find. */
}

export interface TeamOrganizationArgs {
  slug: string /* The name or slug of the team to find. */
}

export interface TeamsOrganizationArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  privacy?: TeamPrivacy | null /* If non-null, filters teams according to privacy */
  role?: TeamRole | null /* If non-null, filters teams according to whether the viewer is an admin or member on team */
  query?:
    | string
    | null /* If non-null, filters teams with query on team name and team slug */
  userLogins: string[] /* User logins to filter by */
  orderBy?: TeamOrder | null /* Ordering options for teams returned from the connection */
  ldapMapped?:
    | boolean
    | null /* If true, filters teams that are mapped to an LDAP Group (Enterprise only) */
  rootTeamsOnly?: boolean | null /* If true, restrict to only root teams */
}

export interface ColumnsProjectArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface PendingCardsProjectArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface CardsProjectColumnArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface AssigneesIssueArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface CommentsIssueArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface LabelsIssueArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ParticipantsIssueArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ProjectCardsIssueArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ReactionsIssueArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  content?: ReactionContent | null /* Allows filtering Reactions by emoji. */
  orderBy?: ReactionOrder | null /* Allows specifying the order in which reactions are returned. */
}

export interface TimelineIssueArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  since?: DateTime | null /* Allows filtering timeline events by a &#x60;since&#x60; timestamp. */
}

export interface AvatarUrlUserArgs {
  size?: number | null /* The size of the resulting square image. */
}

export interface CommitCommentsUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ContributedRepositoriesUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  privacy?: RepositoryPrivacy | null /* If non-null, filters repositories according to privacy */
  orderBy?: RepositoryOrder | null /* Ordering options for repositories returned from the connection */
  affiliations?:
    | RepositoryAffiliation[]
    | null /* Affiliation options for repositories returned from the connection */
  isLocked?:
    | boolean
    | null /* If non-null, filters repositories according to whether they have been locked */
}

export interface FollowersUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface FollowingUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface GistUserArgs {
  name: string /* The gist name to find. */
}

export interface GistCommentsUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface GistsUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  privacy?: GistPrivacy | null /* Filters Gists according to privacy. */
  orderBy?: GistOrder | null /* Ordering options for gists returned from the connection */
}

export interface IssueCommentsUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface IssuesUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  labels: string[] /* A list of label names to filter the pull requests by. */
  orderBy?: IssueOrder | null /* Ordering options for issues returned from the connection. */
  states: IssueState[] /* A list of states to filter the issues by. */
}

export interface OrganizationUserArgs {
  login: string /* The login of the organization to find. */
}

export interface OrganizationsUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface PinnedRepositoriesUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  privacy?: RepositoryPrivacy | null /* If non-null, filters repositories according to privacy */
  orderBy?: RepositoryOrder | null /* Ordering options for repositories returned from the connection */
  affiliations?:
    | RepositoryAffiliation[]
    | null /* Affiliation options for repositories returned from the connection */
  isLocked?:
    | boolean
    | null /* If non-null, filters repositories according to whether they have been locked */
}

export interface PublicKeysUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface PullRequestsUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  states: PullRequestState[] /* A list of states to filter the pull requests by. */
  labels: string[] /* A list of label names to filter the pull requests by. */
  headRefName?:
    | string
    | null /* The head ref name to filter the pull requests by. */
  baseRefName?:
    | string
    | null /* The base ref name to filter the pull requests by. */
  orderBy?: IssueOrder | null /* Ordering options for pull requests returned from the connection. */
}

export interface RepositoriesUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  privacy?: RepositoryPrivacy | null /* If non-null, filters repositories according to privacy */
  orderBy?: RepositoryOrder | null /* Ordering options for repositories returned from the connection */
  affiliations?:
    | RepositoryAffiliation[]
    | null /* Affiliation options for repositories returned from the connection */
  isLocked?:
    | boolean
    | null /* If non-null, filters repositories according to whether they have been locked */
  isFork?:
    | boolean
    | null /* If non-null, filters repositories according to whether they are forks of another repository */
}

export interface RepositoriesContributedToUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  privacy?: RepositoryPrivacy | null /* If non-null, filters repositories according to privacy */
  orderBy?: RepositoryOrder | null /* Ordering options for repositories returned from the connection */
  isLocked?:
    | boolean
    | null /* If non-null, filters repositories according to whether they have been locked */
  includeUserRepositories?:
    | boolean
    | null /* If true, include user repositories */
  contributionTypes?:
    | RepositoryContributionType[]
    | null /* If non-null, include only the specified types of contributions. The GitHub.com UI uses [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY] */
}

export interface RepositoryUserArgs {
  name: string /* Name of Repository to find. */
}

export interface StarredRepositoriesUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  ownedByViewer?:
    | boolean
    | null /* Filters starred repositories to only return repositories owned by the viewer. */
  orderBy?: StarOrder | null /* Order for connection */
}

export interface WatchingUserArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  privacy?: RepositoryPrivacy | null /* If non-null, filters repositories according to privacy */
  orderBy?: RepositoryOrder | null /* Ordering options for repositories returned from the connection */
  affiliations?:
    | RepositoryAffiliation[]
    | null /* Affiliation options for repositories returned from the connection */
  isLocked?:
    | boolean
    | null /* If non-null, filters repositories according to whether they have been locked */
}

export interface AssignableUsersRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface CollaboratorsRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  affiliation?: CollaboratorAffiliation | null /* Collaborators affiliation level with a repository. */
}

export interface CommitCommentsRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface DeployKeysRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface DeploymentsRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  environments: string[] /* Environments to list deployments for */
}

export interface ForksRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  privacy?: RepositoryPrivacy | null /* If non-null, filters repositories according to privacy */
  orderBy?: RepositoryOrder | null /* Ordering options for repositories returned from the connection */
  affiliations?:
    | RepositoryAffiliation[]
    | null /* Affiliation options for repositories returned from the connection */
  isLocked?:
    | boolean
    | null /* If non-null, filters repositories according to whether they have been locked */
}

export interface IssueRepositoryArgs {
  number: number /* The number for the issue to be returned. */
}

export interface IssueOrPullRequestRepositoryArgs {
  number: number /* The number for the issue to be returned. */
}

export interface IssuesRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  labels: string[] /* A list of label names to filter the pull requests by. */
  orderBy?: IssueOrder | null /* Ordering options for issues returned from the connection. */
  states: IssueState[] /* A list of states to filter the issues by. */
}

export interface LabelRepositoryArgs {
  name: string /* Label name */
}

export interface LabelsRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface LanguagesRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  orderBy?: LanguageOrder | null /* Order for connection */
}

export interface MentionableUsersRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface MilestoneRepositoryArgs {
  number: number /* The number for the milestone to be returned. */
}

export interface MilestonesRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ObjectRepositoryArgs {
  oid?: GitObjectID | null /* The Git object ID */
  expression?:
    | string
    | null /* A Git revision expression suitable for rev-parse */
}

export interface ProjectRepositoryArgs {
  number: number /* The project number to find. */
}

export interface ProjectsRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  orderBy?: ProjectOrder | null /* Ordering options for projects returned from the connection */
  search?:
    | string
    | null /* Query to search projects by, currently only searching by name. */
  states: ProjectState[] /* A list of states to filter the projects by. */
}

export interface ProtectedBranchesRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface PullRequestRepositoryArgs {
  number: number /* The number for the pull request to be returned. */
}

export interface PullRequestsRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  states: PullRequestState[] /* A list of states to filter the pull requests by. */
  labels: string[] /* A list of label names to filter the pull requests by. */
  headRefName?:
    | string
    | null /* The head ref name to filter the pull requests by. */
  baseRefName?:
    | string
    | null /* The base ref name to filter the pull requests by. */
  orderBy?: IssueOrder | null /* Ordering options for pull requests returned from the connection. */
}

export interface RefRepositoryArgs {
  qualifiedName: string /* The ref to retrieve.Fully qualified matches are checked in order (&#x60;refs/heads/master&#x60;) before falling back onto checks for short name matches (&#x60;master&#x60;). */
}

export interface RefsRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  refPrefix: string /* A ref name prefix like &#x60;refs/heads/&#x60;, &#x60;refs/tags/&#x60;, etc. */
  direction?: OrderDirection | null /* DEPRECATED: use orderBy. The ordering direction. */
  orderBy?: RefOrder | null /* Ordering options for refs returned from the connection. */
}

export interface ReleaseRepositoryArgs {
  tagName: string /* The name of the Tag the Release was created from */
}

export interface ReleasesRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  orderBy?: ReleaseOrder | null /* Order for connection */
}

export interface RepositoryTopicsRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ShortDescriptionHtmlRepositoryArgs {
  limit?: number | null /* How many characters to return. */
}

export interface StargazersRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  orderBy?: StarOrder | null /* Order for connection */
}

export interface WatchersRepositoryArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ReactionsCommitCommentArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  content?: ReactionContent | null /* Allows filtering Reactions by emoji. */
  orderBy?: ReactionOrder | null /* Allows specifying the order in which reactions are returned. */
}

export interface UsersReactionGroupArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface BlameCommitArgs {
  path: string /* The file whose Git blame information you want. */
}

export interface CommentsCommitArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface HistoryCommitArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  path?:
    | string
    | null /* If non-null, filters history to only show commits touching files under this path. */
  author?: CommitAuthor | null /* If non-null, filters history to only show commits with matching authorship. */
  since?: GitTimestamp | null /* Allows specifying a beginning time or date for fetching commits. */
  until?: GitTimestamp | null /* Allows specifying an ending time or date for fetching commits. */
}

export interface ParentsCommitArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface AvatarUrlGitActorArgs {
  size?: number | null /* The size of the resulting square image. */
}

export interface ContextStatusArgs {
  name: string /* The context name. */
}

export interface AssociatedPullRequestsRefArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  states: PullRequestState[] /* A list of states to filter the pull requests by. */
  labels: string[] /* A list of label names to filter the pull requests by. */
  headRefName?:
    | string
    | null /* The head ref name to filter the pull requests by. */
  baseRefName?:
    | string
    | null /* The base ref name to filter the pull requests by. */
  orderBy?: IssueOrder | null /* Ordering options for pull requests returned from the connection. */
}

export interface AssigneesPullRequestArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface CommentsPullRequestArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface CommitsPullRequestArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface LabelsPullRequestArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ParticipantsPullRequestArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ProjectCardsPullRequestArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ReactionsPullRequestArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  content?: ReactionContent | null /* Allows filtering Reactions by emoji. */
  orderBy?: ReactionOrder | null /* Allows specifying the order in which reactions are returned. */
}

export interface ReviewRequestsPullRequestArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ReviewsPullRequestArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  states: PullRequestReviewState[] /* A list of states to filter the reviews. */
  author?: string | null /* Filter by author of the review. */
}

export interface TimelinePullRequestArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  since?: DateTime | null /* Allows filtering timeline events by a &#x60;since&#x60; timestamp. */
}

export interface IssuesLabelArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  labels: string[] /* A list of label names to filter the pull requests by. */
  orderBy?: IssueOrder | null /* Ordering options for issues returned from the connection. */
  states: IssueState[] /* A list of states to filter the issues by. */
}

export interface PullRequestsLabelArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  states: PullRequestState[] /* A list of states to filter the pull requests by. */
  labels: string[] /* A list of label names to filter the pull requests by. */
  headRefName?:
    | string
    | null /* The head ref name to filter the pull requests by. */
  baseRefName?:
    | string
    | null /* The base ref name to filter the pull requests by. */
  orderBy?: IssueOrder | null /* Ordering options for pull requests returned from the connection. */
}

export interface ReactionsIssueCommentArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  content?: ReactionContent | null /* Allows filtering Reactions by emoji. */
  orderBy?: ReactionOrder | null /* Allows specifying the order in which reactions are returned. */
}

export interface IssuesMilestoneArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  labels: string[] /* A list of label names to filter the pull requests by. */
  orderBy?: IssueOrder | null /* Ordering options for issues returned from the connection. */
  states: IssueState[] /* A list of states to filter the issues by. */
}

export interface AncestorsTeamArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ChildTeamsTeamArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  orderBy?: TeamOrder | null /* Order for connection */
  userLogins: string[] /* User logins to filter by */
  immediateOnly?:
    | boolean
    | null /* Whether to list immediate child teams or all descendant child teams. */
}

export interface InvitationsTeamArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface MembersTeamArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  query?: string | null /* The search string to look for. */
  membership?: TeamMembershipType | null /* Filter by membership type */
  role?: TeamMemberRole | null /* Filter by team member role */
}

export interface RepositoriesTeamArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  query?: string | null /* The search string to look for. */
  orderBy?: TeamRepositoryOrder | null /* Order for the connection. */
}

export interface CommentsPullRequestReviewArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ReactionsPullRequestReviewCommentArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  content?: ReactionContent | null /* Allows filtering Reactions by emoji. */
  orderBy?: ReactionOrder | null /* Allows specifying the order in which reactions are returned. */
}

export interface CommentsCommitCommentThreadArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface CommentsPullRequestReviewThreadArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface StatusesDeploymentArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface PushAllowancesProtectedBranchArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ReviewDismissalAllowancesProtectedBranchArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface ReleaseAssetsReleaseArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  name?: string | null /* A list of names to filter the assets by. */
}

export interface CommentsGistArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface StargazersGistArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
  orderBy?: StarOrder | null /* Order for connection */
}

export interface ExternalIdentitiesOrganizationIdentityProviderArgs {
  first?: number | null /* Returns the first _n_ elements from the list. */
  after?:
    | string
    | null /* Returns the elements in the list that come after the specified global ID. */
  last?: number | null /* Returns the last _n_ elements from the list. */
  before?:
    | string
    | null /* Returns the elements in the list that come before the specified global ID. */
}

export interface AcceptTopicSuggestionMutationArgs {
  input: AcceptTopicSuggestionInput
}

export interface AddCommentMutationArgs {
  input: AddCommentInput
}

export interface AddProjectCardMutationArgs {
  input: AddProjectCardInput
}

export interface AddProjectColumnMutationArgs {
  input: AddProjectColumnInput
}

export interface AddPullRequestReviewMutationArgs {
  input: AddPullRequestReviewInput
}

export interface AddPullRequestReviewCommentMutationArgs {
  input: AddPullRequestReviewCommentInput
}

export interface AddReactionMutationArgs {
  input: AddReactionInput
}

export interface AddStarMutationArgs {
  input: AddStarInput
}

export interface CreateProjectMutationArgs {
  input: CreateProjectInput
}

export interface DeclineTopicSuggestionMutationArgs {
  input: DeclineTopicSuggestionInput
}

export interface DeleteProjectMutationArgs {
  input: DeleteProjectInput
}

export interface DeleteProjectCardMutationArgs {
  input: DeleteProjectCardInput
}

export interface DeleteProjectColumnMutationArgs {
  input: DeleteProjectColumnInput
}

export interface DeletePullRequestReviewMutationArgs {
  input: DeletePullRequestReviewInput
}

export interface DismissPullRequestReviewMutationArgs {
  input: DismissPullRequestReviewInput
}

export interface MoveProjectCardMutationArgs {
  input: MoveProjectCardInput
}

export interface MoveProjectColumnMutationArgs {
  input: MoveProjectColumnInput
}

export interface RemoveOutsideCollaboratorMutationArgs {
  input: RemoveOutsideCollaboratorInput
}

export interface RemoveReactionMutationArgs {
  input: RemoveReactionInput
}

export interface RemoveStarMutationArgs {
  input: RemoveStarInput
}

export interface RequestReviewsMutationArgs {
  input: RequestReviewsInput
}

export interface SubmitPullRequestReviewMutationArgs {
  input: SubmitPullRequestReviewInput
}

export interface UpdateProjectMutationArgs {
  input: UpdateProjectInput
}

export interface UpdateProjectCardMutationArgs {
  input: UpdateProjectCardInput
}

export interface UpdateProjectColumnMutationArgs {
  input: UpdateProjectColumnInput
}

export interface UpdatePullRequestReviewMutationArgs {
  input: UpdatePullRequestReviewInput
}

export interface UpdatePullRequestReviewCommentMutationArgs {
  input: UpdatePullRequestReviewCommentInput
}

export interface UpdateSubscriptionMutationArgs {
  input: UpdateSubscriptionInput
}

export interface UpdateTopicsMutationArgs {
  input: UpdateTopicsInput
}

export interface AvatarUrlBotArgs {
  size?: number | null /* The size of the resulting square image. */
}

export interface ShortDescriptionHtmlRepositoryInvitationRepositoryArgs {
  limit?: number | null /* How many characters to return. */
}

/* The privacy of a repository */
export type RepositoryPrivacy = 'PUBLIC' | 'PRIVATE'

/* Properties by which repository connections can be ordered. */
export type RepositoryOrderField =
  | 'CREATED_AT'
  | 'UPDATED_AT'
  | 'PUSHED_AT'
  | 'NAME'
  | 'STARGAZERS'

/* Possible directions in which to order a list of items when provided an &#x60;orderBy&#x60; argument. */
export type OrderDirection = 'ASC' | 'DESC'

/* The affiliation of a user to a repository */
export type RepositoryAffiliation =
  | 'OWNER'
  | 'COLLABORATOR'
  | 'ORGANIZATION_MEMBER'

/* The possible states of a subscription. */
export type SubscriptionState =
  | 'UNSUBSCRIBED'
  | 'SUBSCRIBED'
  | 'IGNORED'
  | 'UNAVAILABLE'

/* Properties by which star connections can be ordered. */
export type StarOrderField = 'STARRED_AT'

/* The possible reasons a given repository could be in a locked state. */
export type RepositoryLockReason = 'MOVING' | 'BILLING' | 'RENAME' | 'MIGRATING'

/* Collaborators affiliation level with a repository. */
export type CollaboratorAffiliation = 'OUTSIDE' | 'DIRECT' | 'ALL'

/* The access level to a repository */
export type RepositoryPermission = 'ADMIN' | 'WRITE' | 'READ'

/* A comment author association with repository. */
export type CommentAuthorAssociation =
  | 'MEMBER'
  | 'OWNER'
  | 'COLLABORATOR'
  | 'CONTRIBUTOR'
  | 'FIRST_TIME_CONTRIBUTOR'
  | 'FIRST_TIMER'
  | 'NONE'

/* The possible errors that will prevent a user from updating a comment. */
export type CommentCannotUpdateReason =
  | 'INSUFFICIENT_ACCESS'
  | 'LOCKED'
  | 'LOGIN_REQUIRED'
  | 'MAINTENANCE'
  | 'VERIFIED_EMAIL_REQUIRED'

/* Emojis that can be attached to Issues, Pull Requests and Comments. */
export type ReactionContent =
  | 'THUMBS_UP'
  | 'THUMBS_DOWN'
  | 'LAUGH'
  | 'HOORAY'
  | 'CONFUSED'
  | 'HEART'

/* A list of fields that reactions can be ordered by. */
export type ReactionOrderField = 'CREATED_AT'

/* The state of a Git signature. */
export type GitSignatureState =
  | 'VALID'
  | 'INVALID'
  | 'MALFORMED_SIG'
  | 'UNKNOWN_KEY'
  | 'BAD_EMAIL'
  | 'UNVERIFIED_EMAIL'
  | 'NO_USER'
  | 'UNKNOWN_SIG_TYPE'
  | 'UNSIGNED'
  | 'GPGVERIFY_UNAVAILABLE'
  | 'GPGVERIFY_ERROR'
  | 'NOT_SIGNING_KEY'
  | 'EXPIRED_KEY'

/* The possible commit status states. */
export type StatusState =
  | 'EXPECTED'
  | 'ERROR'
  | 'FAILURE'
  | 'PENDING'
  | 'SUCCESS'

/* The possible states of a pull request. */
export type PullRequestState = 'OPEN' | 'CLOSED' | 'MERGED'

/* Properties by which issue connections can be ordered. */
export type IssueOrderField = 'CREATED_AT' | 'UPDATED_AT' | 'COMMENTS'

/* The possible states of an issue. */
export type IssueState = 'OPEN' | 'CLOSED'

/* Whether or not a PullRequest can be merged. */
export type MergeableState = 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN'

/* The possible states of a milestone. */
export type MilestoneState = 'OPEN' | 'CLOSED'

/* Properties by which team connections can be ordered. */
export type TeamOrderField = 'NAME'

/* The possible organization invitation types. */
export type OrganizationInvitationType = 'USER' | 'EMAIL'

/* The possible organization invitation roles. */
export type OrganizationInvitationRole =
  | 'DIRECT_MEMBER'
  | 'ADMIN'
  | 'BILLING_MANAGER'
  | 'REINSTATE'

/* Defines which types of team members are included in the returned list. Can be one of IMMEDIATE, CHILD_TEAM or ALL. */
export type TeamMembershipType = 'IMMEDIATE' | 'CHILD_TEAM' | 'ALL'

/* The possible team member roles; either &#x27;maintainer&#x27; or &#x27;member&#x27;. */
export type TeamMemberRole = 'MAINTAINER' | 'MEMBER'

/* The possible team privacy values. */
export type TeamPrivacy = 'SECRET' | 'VISIBLE'

/* Properties by which team repository connections can be ordered. */
export type TeamRepositoryOrderField =
  | 'CREATED_AT'
  | 'UPDATED_AT'
  | 'PUSHED_AT'
  | 'NAME'
  | 'PERMISSION'
  | 'STARGAZERS'

/* The possible states of a pull request review. */
export type PullRequestReviewState =
  | 'PENDING'
  | 'COMMENTED'
  | 'APPROVED'
  | 'CHANGES_REQUESTED'
  | 'DISMISSED'

/* The possible states for a deployment status. */
export type DeploymentStatusState =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILURE'
  | 'INACTIVE'
  | 'ERROR'

/* The possible states in which a deployment can be. */
export type DeploymentState =
  | 'ABANDONED'
  | 'ACTIVE'
  | 'DESTROYED'
  | 'ERROR'
  | 'FAILURE'
  | 'INACTIVE'
  | 'PENDING'

/* Properties by which language connections can be ordered. */
export type LanguageOrderField = 'SIZE'

/* Properties by which project connections can be ordered. */
export type ProjectOrderField = 'CREATED_AT' | 'UPDATED_AT' | 'NAME'

/* State of the project; either &#x27;open&#x27; or &#x27;closed&#x27; */
export type ProjectState = 'OPEN' | 'CLOSED'

/* Properties by which ref connections can be ordered. */
export type RefOrderField = 'TAG_COMMIT_DATE' | 'ALPHABETICAL'

/* Properties by which release connections can be ordered. */
export type ReleaseOrderField = 'CREATED_AT' | 'NAME'

/* The privacy of a Gist */
export type GistPrivacy = 'PUBLIC' | 'SECRET' | 'ALL'

/* Properties by which gist connections can be ordered. */
export type GistOrderField = 'CREATED_AT' | 'UPDATED_AT' | 'PUSHED_AT'

/* The reason a repository is listed as &#x27;contributed&#x27;. */
export type RepositoryContributionType =
  | 'COMMIT'
  | 'ISSUE'
  | 'PULL_REQUEST'
  | 'REPOSITORY'
  | 'PULL_REQUEST_REVIEW'

/* Various content states of a ProjectCard */
export type ProjectCardState = 'CONTENT_ONLY' | 'NOTE_ONLY' | 'REDACTED'

/* The role of a user on a team. */
export type TeamRole = 'ADMIN' | 'MEMBER'

/* Represents the individual results of a search. */
export type SearchType = 'ISSUE' | 'REPOSITORY' | 'USER'

/* The possible events to perform on a pull request review. */
export type PullRequestReviewEvent =
  | 'COMMENT'
  | 'APPROVE'
  | 'REQUEST_CHANGES'
  | 'DISMISS'

/* Reason that the suggested topic is declined. */
export type TopicSuggestionDeclineReason =
  | 'NOT_RELEVANT'
  | 'TOO_SPECIFIC'
  | 'PERSONAL_PREFERENCE'
  | 'TOO_GENERAL'

/* The possible PubSub channels for an issue. */
export type IssuePubSubTopic = 'UPDATED' | 'MARKASREAD'

/* The possible PubSub channels for a pull request. */
export type PullRequestPubSubTopic = 'UPDATED' | 'MARKASREAD' | 'HEAD_REF'

/* The possible default permissions for organization-owned repositories. */
export type DefaultRepositoryPermissionField = 'READ' | 'WRITE' | 'ADMIN'

/* The affiliation type between collaborator and repository. */
export type RepositoryCollaboratorAffiliation = 'ALL' | 'OUTSIDE'

/* Types that can be inside Project Cards. */
export type ProjectCardItem = Issue | PullRequest

/* Types that can be requested reviewers. */
export type RequestedReviewer = User | Team

/* An item in an pull request timeline */
export type PullRequestTimelineItem =
  | Commit
  | CommitCommentThread
  | PullRequestReview
  | PullRequestReviewThread
  | PullRequestReviewComment
  | IssueComment
  | ClosedEvent
  | ReopenedEvent
  | SubscribedEvent
  | UnsubscribedEvent
  | MergedEvent
  | ReferencedEvent
  | CrossReferencedEvent
  | AssignedEvent
  | UnassignedEvent
  | LabeledEvent
  | UnlabeledEvent
  | MilestonedEvent
  | DemilestonedEvent
  | RenamedTitleEvent
  | LockedEvent
  | UnlockedEvent
  | DeployedEvent
  | HeadRefDeletedEvent
  | HeadRefRestoredEvent
  | HeadRefForcePushedEvent
  | BaseRefForcePushedEvent
  | ReviewRequestedEvent
  | ReviewRequestRemovedEvent
  | ReviewDismissedEvent

/* Any referencable object */
export type ReferencedSubject = Issue | PullRequest

/* Types that can be inside a Milestone. */
export type MilestoneItem = Issue | PullRequest

/* An object which has a renamable title */
export type RenamedTitleSubject = Issue | PullRequest

/* Used for return value of Repository.issueOrPullRequest. */
export type IssueOrPullRequest = Issue | PullRequest

/* Types that can be an actor. */
export type PushAllowanceActor = User | Team

/* Types that can be an actor. */
export type ReviewDismissalAllowanceActor = User | Team

/* An item in an issue timeline */
export type IssueTimelineItem =
  | Commit
  | IssueComment
  | CrossReferencedEvent
  | ClosedEvent
  | ReopenedEvent
  | SubscribedEvent
  | UnsubscribedEvent
  | ReferencedEvent
  | AssignedEvent
  | UnassignedEvent
  | LabeledEvent
  | UnlabeledEvent
  | MilestonedEvent
  | DemilestonedEvent
  | RenamedTitleEvent
  | LockedEvent
  | UnlockedEvent

/* The results of a search. */
export type SearchResultItem =
  | Issue
  | PullRequest
  | Repository
  | User
  | Organization
  | MarketplaceListing
