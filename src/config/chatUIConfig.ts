/**
 * Chat UI Configuration
 * 
 * This file controls which components and features are visible/enabled
 * in the chat interface. You can easily customize the chat UI by changing
 * these configuration values.
 */

// Utility type for deep partial
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface ChatUIConfig {
  // Main Components
  components: {
    /** Show/hide the chat header with stats */
    header: boolean;

    /** Show/hide the history sidebar */
    sidebar: boolean;

    /** Show/hide upload status messages */
    uploadStatus: boolean;

    /** Show/hide loading bar indicator */
    loadingBar: boolean;

    /** Show/hide suggested queries below input */
    suggestedQueries: boolean;

    /** Show/hide model selector dropdown */
    modelSelector: boolean;

    /** Show/hide file upload button */
    fileUpload: boolean;

    /** Show/hide typing indicator for AI responses */
    typingIndicator: boolean;
  };

  // Message Features
  messages: {
    /** Show/hide user and bot avatars */
    avatars: boolean;

    /** Show/hide message timestamps */
    timestamps: boolean;

    /** Enable markdown rendering in messages */
    markdown: boolean;

    /** Show welcome message on new chat */
    welcomeMessage: boolean;
  };

  // Chat Features
  features: {
    /** Enable conversation history persistence */
    conversationHistory: boolean;

    /** Allow creating new conversations */
    newConversation: boolean;

    /** Allow deleting conversations */
    deleteConversation: boolean;

    /** Enable stats display in header */
    stats: boolean;
  };

  // Theming
  theme: {
    /** Enable dark/light theme toggle */
    themeSwitcher: boolean;
  };
}

// Type for custom configurations (allows partial overrides)
export type ChatUIConfigPartial = DeepPartial<ChatUIConfig>;

/**
 * Default configuration
 * Change these values to customize your chat UI
 */
export const chatUIConfig: ChatUIConfig = {
  components: {
    header: true,
    sidebar: false,
    uploadStatus: true,
    loadingBar: true,
    suggestedQueries: true,
    modelSelector: true,
    fileUpload: false,
    typingIndicator: true,
  },

  messages: {
    avatars: true,
    timestamps: true,
    markdown: true,
    welcomeMessage: true,
  },

  features: {
    conversationHistory: true,
    newConversation: true,
    deleteConversation: true,
    stats: false,
  },

  theme: {
    themeSwitcher: true,
  },
};

/**
 * Example configurations for different use cases
 */

// Minimal chat interface
export const minimalConfig: ChatUIConfig = {
  components: {
    header: false,
    sidebar: false,
    uploadStatus: false,
    loadingBar: true,
    suggestedQueries: false,
    modelSelector: false,
    fileUpload: false,
    typingIndicator: true,
  },
  messages: {
    avatars: false,
    timestamps: false,
    markdown: true,
    welcomeMessage: false,
  },
  features: {
    conversationHistory: false,
    newConversation: false,
    deleteConversation: false,
    stats: false,
  },
  theme: {
    themeSwitcher: false,
  },
};

// Full-featured chat interface
export const fullFeaturedConfig: ChatUIConfig = {
  components: {
    header: true,
    sidebar: true,
    uploadStatus: true,
    loadingBar: true,
    suggestedQueries: true,
    modelSelector: true,
    fileUpload: true,
    typingIndicator: true,
  },
  messages: {
    avatars: true,
    timestamps: true,
    markdown: true,
    welcomeMessage: true,
  },
  features: {
    conversationHistory: true,
    newConversation: true,
    deleteConversation: true,
    stats: true,
  },
  theme: {
    themeSwitcher: true,
  },
};

// Simple Q&A interface (no history, no uploads)
export const simpleQAConfig: ChatUIConfig = {
  components: {
    header: false,
    sidebar: false,
    uploadStatus: false,
    loadingBar: true,
    suggestedQueries: true,
    modelSelector: false,
    fileUpload: false,
    typingIndicator: true,
  },
  messages: {
    avatars: true,
    timestamps: false,
    markdown: true,
    welcomeMessage: true,
  },
  features: {
    conversationHistory: false,
    newConversation: false,
    deleteConversation: false,
    stats: false,
  },
  theme: {
    themeSwitcher: true,
  },
};
